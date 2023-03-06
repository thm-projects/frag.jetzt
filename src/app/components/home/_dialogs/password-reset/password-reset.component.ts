import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  checkForEquality,
  checkForPasswordValidity,
} from '../register/register.component';
import {
  AuthenticationService,
  LoginResult,
} from '../../../../services/http/authentication.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatProgressBar } from '@angular/material/progress-bar';

export class PasswordResetErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean {
    const isSubmitted = form && form.submitted;
    return (
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss'],
})
export class PasswordResetComponent implements OnInit, AfterViewInit {
  @ViewChild('customProgressBar') customProgressBar: MatProgressBar;
  initProcess = true;

  usernameFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  usernameFormControl2 = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  passwordFormControl = new FormControl('', [
    Validators.required,
    checkForPasswordValidity(this.usernameFormControl2),
  ]);
  passwordFormControl2 = new FormControl('', [
    Validators.required,
    checkForEquality(this.passwordFormControl),
  ]);
  keyFormControl = new FormControl('', [Validators.required]);

  matcher = new PasswordResetErrorStateMatcher();
  passwordStrength: number;

  isPasswordVisible = false;

  constructor(
    private translationService: TranslateService,
    public authenticationService: AuthenticationService,
    public notificationService: NotificationService,
    public dialogRef: MatDialogRef<PasswordResetComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private liveAnnouncer: LiveAnnouncer,
  ) {}

  ngOnInit() {
    this.announce();
  }

  ngAfterViewInit(): void {
    this.checkPasswordStrength();
  }

  public announce() {
    const lang: string = this.translationService.currentLang;

    // current live announcer content must be cleared before next read
    this.liveAnnouncer.clear();

    if (lang === 'de') {
      this.liveAnnouncer.announce(
        'Hier kannst du dein Passwort zurücksetzen, ' +
          'indem du per E-Mail einen Passwortrücksetz-Schlüssel erhälst und mit diesem ein neues Passwort setzt.',
        'assertive',
      );
    } else {
      this.liveAnnouncer.announce(
        'Here you can reset your password ' +
          'by receiving a password reset key via e-mail and setting a new password with it.',
        'assertive',
      );
    }
  }

  setUsername(username: string) {
    this.usernameFormControl2.setValue(username);
  }

  /**
   * Closes the room create dialog on call.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  resetPassword(username: string): void {
    username = username.trim();

    if (
      !this.usernameFormControl.hasError('required') &&
      !this.usernameFormControl.hasError('email')
    ) {
      this.authenticationService
        .resetPassword(username)
        .subscribe((ret: string) => {
          // ret is null when no error happened, otherwise ret has error message
          if (ret === 'Account has activation key set') {
            this.translationService
              .get('password-reset.reset-failed-because-of-activation-process')
              .subscribe((message) => {
                this.notificationService.show(message);
              });
          } else {
            this.translationService
              .get('password-reset.reset-successful')
              .subscribe((message) => {
                this.notificationService.show(message);
              });
          }
          this.closeDialog();
        });
    } else {
      this.translationService
        .get('password-reset.input-incorrect')
        .subscribe((message) => {
          this.notificationService.show(message);
        });
    }
  }

  setNewPassword(email: string, key: string, password: string) {
    if (
      !this.usernameFormControl2.hasError('required') &&
      !this.usernameFormControl2.hasError('email') &&
      !this.passwordFormControl2.hasError('passwordIsEqual')
    ) {
      if (email !== '' && key !== '' && password !== '') {
        this.authenticationService
          .setNewPassword(email, key, password)
          .subscribe({
            next: () => {
              this.translationService
                .get('password-reset.new-password-successful')
                .subscribe((message) => {
                  this.notificationService.show(message);
                });
              this.closeDialog();
            },
            error: (errorCode: any) => {
              if (errorCode === 'Key expired') {
                this.translationService
                  .get('password-reset.new-password-key-expired')
                  .subscribe((message) => {
                    this.notificationService.show(message);
                  });
              } else if (errorCode === 'Invalid Key') {
                this.translationService
                  .get('password-reset.new-password-key-invalid')
                  .subscribe((message) => {
                    this.notificationService.show(message);
                  });
              } else if (errorCode === LoginResult.PasswordTooCommon) {
                this.translationService
                  .get('register.register-error-password-too-common')
                  .subscribe((message) => {
                    this.notificationService.show(message);
                  });
              } else {
                this.translationService
                  .get('register.register-request-error')
                  .subscribe((message) => {
                    this.notificationService.show(message);
                  });
              }
            },
          });
      } else {
        this.translationService
          .get('password-reset.input-incorrect')
          .subscribe((message) => {
            this.notificationService.show(message);
          });
      }
    } else {
      this.translationService
        .get('password-reset.input-incorrect')
        .subscribe((message) => {
          this.notificationService.show(message);
        });
    }
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog();
  }

  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildPasswordResetActionCallback(email: HTMLInputElement): () => void {
    return () => this.resetPassword(email.value);
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  checkPasswordStrength() {
    if (this.passwordFormControl.errors) {
      this.passwordStrength = 5;
      return;
    }
    let permutation = 1;
    for (const c of this.passwordFormControl.value.split('')) {
      if (
        (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9')
      ) {
        permutation *= 36;
      } else if ('!@#$%^&*()_+-=?'.includes(c)) {
        permutation *= 51;
      } else {
        permutation *= 2097152;
      }
    }

    const oneYearFourCores = 2052e13;
    this.passwordStrength = Math.max(
      5,
      Math.min(100, (Math.log(permutation) * 100) / Math.log(oneYearFourCores)),
    );
    const color =
      'rgb(' +
      Math.round((255 * (100 - this.passwordStrength)) / 100) +
      ', ' +
      Math.round((255 * this.passwordStrength) / 100) +
      ', 0)';
    this.customProgressBar._elementRef.nativeElement.style.setProperty(
      '--line-color',
      color,
    );
  }
}
