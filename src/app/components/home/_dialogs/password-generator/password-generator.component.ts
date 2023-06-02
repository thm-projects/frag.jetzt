import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from 'app/services/http/authentication.service';
import { LanguageService } from 'app/services/util/language.service';
import { NotificationService } from 'app/services/util/notification.service';
import {
  BehaviorSubject,
  debounce,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';

@Component({
  selector: 'app-password-generator',
  templateUrl: './password-generator.component.html',
  styleUrls: ['./password-generator.component.scss'],
})
export class PasswordGeneratorComponent implements OnInit {
  password: string = '';
  passwordCount = new FormControl(12, [
    Validators.required,
    Validators.min(12),
    Validators.max(64),
  ]);
  securityValue = new BehaviorSubject('');
  currentSecurity$ = this.securityValue.pipe(
    distinctUntilChanged(),
    debounceTime(300),
    switchMap((key) =>
      key?.length || 0 > 0 ? this.calculateSecurity(key) : of(''),
    ),
  );
  readonly onConfirm = this.confirm.bind(this);
  readonly onCancel = this.cancel.bind(this);
  readonly DIGITS = '0123456789';
  readonly LOWER = 'abcdefghijklmnopqrstuvwxyz';
  readonly UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  readonly SPECIAL = '!@#$%^&*()_+-=?';
  readonly GEN_STRING = this.DIGITS + this.LOWER + this.UPPER + this.SPECIAL;
  readonly CHARS = this.GEN_STRING.split('');

  constructor(
    private dialogRef: MatDialogRef<PasswordGeneratorComponent>,
    private auth: AuthenticationService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
  ) {}

  static open(dialog: MatDialog) {
    const ref = dialog.open(PasswordGeneratorComponent);
    return ref;
  }

  generatePassword() {
    while (true) {
      this.password = this.makePassword();
      const chars = this.password.split('');
      if (
        chars.some((c) => this.DIGITS.includes(c)) &&
        chars.some((c) => this.LOWER.includes(c)) &&
        chars.some((c) => this.UPPER.includes(c)) &&
        chars.some((c) => this.SPECIAL.includes(c))
      ) {
        break;
      }
    }
    this.securityValue.next(this.password);
  }

  copyPassword() {
    const result = this.password.trim();
    navigator.clipboard
      .writeText(result)
      .then(() => {
        this.translateService
          .get('password-generator.copy-success')
          .subscribe((msg) => this.notificationService.show(msg));
      })
      .catch((err) => {
        console.error(err);
        this.translateService
          .get('password-generator.copy-fail')
          .subscribe((msg) => this.notificationService.show(msg));
      });
  }

  ngOnInit(): void {}

  confirm() {
    if (!this.passwordCount.valid || this.password.trim().length < 8) {
      return;
    }
    this.copyPassword();
    const result = this.password.trim();
    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close();
  }

  private makePassword() {
    if (!this.passwordCount.valid) {
      return;
    }
    let password = '';
    const len = this.passwordCount.value;
    const CHAR_LEN = BigInt(this.GEN_STRING.length);
    while (password.length < len) {
      let data = crypto.getRandomValues(new BigUint64Array(1))[0];
      while (data > 0 && password.length < len) {
        const value = Number(data % CHAR_LEN);
        password += this.GEN_STRING[value];
        data /= CHAR_LEN;
      }
    }
    return password
      .split('')
      .sort(() => crypto.getRandomValues(new Int8Array(1))[0])
      .join('');
  }

  private calculateSecurity(password: string): Observable<string> {
    return this.auth.checkPasswordInDictionary(password).pipe(
      map((data) => {
        data.sort((a, b) => a.start - b.start);
        let index = 0;
        let permutation = 1;
        for (const range of data) {
          permutation *= this.calculatePermutation(
            password.substring(index, range.start),
          );
          permutation *= 3_000_000;
          index = range.end;
        }
        permutation *= this.calculatePermutation(password.substring(index));
        return permutation;
      }),
      map((permutation) => {
        const formatter = new Intl.RelativeTimeFormat(
          this.languageService.currentLanguage(),
        );
        permutation /= 4 * 4 * 1e9;
        if (permutation < 60) {
          return formatter.format(permutation, 'second');
        }
        permutation = Math.round(permutation / 60);
        if (permutation < 60) {
          return formatter.format(permutation, 'minute');
        }
        permutation = Math.round(permutation / 60);
        if (permutation < 24) {
          return formatter.format(permutation, 'hour');
        }
        permutation = Math.round(permutation / 24);
        if (permutation < 365) {
          return formatter.format(permutation, 'day');
        }
        permutation = Math.round(permutation / 365);
        if (permutation < 1e15) {
          return formatter.format(permutation, 'year');
        }
        return null;
      }),
      switchMap((str) => {
        if (!str) {
          return this.translateService.get('password-generator.eternity');
        }
        return this.translateService.get('password-generator.duration', {
          text: str,
        });
      }),
    );
  }

  private calculatePermutation(text: string): number {
    let permutation = 1;
    for (const char of text) {
      if (this.DIGITS.includes(char)) {
        permutation *= 10;
      } else if (this.LOWER.includes(char)) {
        permutation *= 36;
      } else if (this.UPPER.includes(char)) {
        permutation *= 62;
      } else if (this.SPECIAL.includes(char)) {
        permutation *= 77;
      } else if (
        this.CHARS.some(
          (x) =>
            x.localeCompare(char, undefined, { sensitivity: 'base' }) === 0,
        )
      ) {
        permutation *= 100;
      } else {
        permutation *= 2097152;
      }
    }
    return permutation;
  }
}
