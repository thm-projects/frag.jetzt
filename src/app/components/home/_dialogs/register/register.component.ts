import {
  AfterViewInit,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import {
  AuthenticationService,
  LoginResult,
} from '../../../../services/http/authentication.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { PasswordResetComponent } from '../password-reset/password-reset.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { PasswordGeneratorComponent } from '../password-generator/password-generator.component';

export class RegisterErrorStateMatcher implements ErrorStateMatcher {
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

const levenshteinDistance = (stringOne: string, stringTwo: string) => {
  const wordOne = stringOne.toLowerCase();
  const wordTwo = stringTwo.toLowerCase();

  if (wordOne.length === 0 && wordOne.length === 0) return 0;
  if (wordOne.length === 0) return wordTwo.length;
  if (wordTwo.length === 0) return wordOne.length;
  if (wordOne === wordTwo) return 0;

  const matrix = Array(wordOne.length + 1)
    .fill(null)
    .map(() => Array(wordTwo.length + 1).fill(null));

  for (let i = 0; i <= wordOne.length; i++) matrix[i][0] = i;
  for (let i = 0; i <= wordTwo.length; i++) matrix[0][i] = i;

  for (let i = 1; i <= wordOne.length; i++) {
    for (let j = 1; j <= wordTwo.length; j++) {
      const indicator = wordOne[i - 1] === wordTwo[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + indicator,
        matrix[i][j - 1] + indicator,
        matrix[i - 1][j - 1] + indicator,
      );
    }
  }

  return matrix[wordOne.length][wordTwo.length];
};

const splitString = (word: string) => word.split('@')[0].split(/[.\-_]/);

export const checkForPasswordValidity =
  (usernameField: FormControl) => (passwordField: FormControl) => {
    if (passwordField.value.length < 12 || passwordField.value.length > 64)
      return { validLength: { _: false } };
    if (!/\d/.test(passwordField.value))
      return { containsNumber: { _: false } };
    if (!/[a-z]/.test(passwordField.value))
      return { containsLowercase: { _: false } };
    if (!/[A-Z]/.test(passwordField.value))
      return { containsUppercase: { _: false } };
    if (!/[!@#$%^&*()_+\-=\?]/.test(passwordField.value))
      return { containsSpecialCharacter: { _: false } };

    if ((usernameField.value || '').trim().length <= 0) return null;

    // Password Similarity
    const emailSubstrings = splitString(usernameField.value);

    for (const substring of emailSubstrings) {
      if (passwordField.value.toLowerCase().includes(substring.toLowerCase()))
        return { containsEmailElements: { _: false } };
      if (
        levenshteinDistance(
          substring.toLowerCase(),
          passwordField.value.toLowerCase(),
        ) < 3
      )
        return { containsEmailElements: { _: false } };
    }

    return null;
  };

export const checkForEquality =
  (fieldOne: FormControl) => (fieldTwo: FormControl) =>
    fieldOne.value !== fieldTwo.value ? { isEqual: { _: false } } : null;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, AfterViewInit {
  @ViewChild('customProgressBar') customProgressBar: MatProgressBar;
  usernameFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  username2FormControl = new FormControl('', [
    Validators.required,
    checkForEquality(this.usernameFormControl),
  ]);
  password1FormControl = new FormControl('', [
    Validators.required,
    checkForPasswordValidity(this.usernameFormControl),
  ]);
  password2FormControl = new FormControl('', [
    Validators.required,
    checkForEquality(this.password1FormControl),
  ]);

  matcher = new RegisterErrorStateMatcher();
  passwordStrength: number = 5;
  userEdit = true;

  isPasswordVisible = false;

  constructor(
    private translationService: TranslateService,
    public authenticationService: AuthenticationService,
    public notificationService: NotificationService,
    public dialogRef: MatDialogRef<RegisterComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
  ) {}

  /**
   * Closes the register dialog on call.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  /**
   * @inheritDoc
   */
  ngOnInit() {
    // nothing special yet
  }

  ngAfterViewInit(): void {
    this.checkPasswordStrength();
  }

  register(username: string, password: string): void {
    if (
      !this.usernameFormControl.valid ||
      !this.username2FormControl.valid ||
      !this.password1FormControl.valid ||
      !this.password2FormControl.valid
    ) {
      this.translationService
        .get('register.register-unsuccessful')
        .subscribe((message) => {
          this.notificationService.show(message);
        });
      return;
    }
    this.authenticationService.register(username, password).subscribe({
      next: () => {
        this.translationService
          .get('register.register-successful')
          .subscribe((message) => {
            this.notificationService.show(message, undefined, {
              duration: 12_500,
              panelClass: ['snackbar-valid'],
            });
          });
        this.dialogRef.close({ username, password });
      },
      error: (errorCode: LoginResult) => {
        if (errorCode === LoginResult.PasswordTooCommon) {
          this.translationService
            .get('register.register-error-password-too-common')
            .subscribe((message) => {
              this.notificationService.show(message, undefined, {
                duration: 12_500,
                panelClass: ['snackbar-warn'],
              });
            });
        } else {
          this.translationService
            .get('register.register-request-error')
            .subscribe((message) => {
              this.notificationService.show(message, undefined, {
                duration: 12_500,
                panelClass: ['snackbar-invalid'],
              });
            });
        }
      },
    });
  }

  openPasswordGenerator(event: MouseEvent) {
    event.preventDefault();
    const ref = PasswordGeneratorComponent.open(this.dialog);
    ref.afterClosed().subscribe((data) => {
      if (data) {
        this.password1FormControl.setValue(data);
        this.password2FormControl.setValue(data);
        this.checkPasswordStrength();
        this.userEdit = false;
      }
    });
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog();
  }

  copyPassword() {
    navigator.clipboard.writeText(this.password1FormControl.value).then(
      () => {
        this.translationService
          .get('password-generator.copy-success')
          .subscribe((msg) => this.notificationService.show(msg));
      },
      (err) => {
        console.error(err);
        this.translationService
          .get('password-generator.copy-fail')
          .subscribe((msg) => this.notificationService.show(msg));
      },
    );
  }

  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildRegisterActionCallback(
    userName: HTMLInputElement,
    password: HTMLInputElement,
  ): () => void {
    return () => this.register(userName.value, password.value);
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  checkPasswordStrength() {
    PasswordResetComponent.calculateStrength(
      this.authenticationService,
      this.password1FormControl,
    ).subscribe(([strength, color]) => {
      this.passwordStrength = strength;
      this.customProgressBar._elementRef.nativeElement.style.setProperty(
        '--line-color',
        color,
      );
    });
  }
}
