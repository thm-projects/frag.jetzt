import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorStateMatcher } from '@angular/material/core';

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

export const checkForEquality =
  (fieldOne: FormControl) => (fieldTwo: FormControl) => {
    const fieldOneValue = fieldOne.value;
    const fieldTwoValue = fieldTwo.value;

    return fieldOneValue !== fieldTwoValue ? { isEqual: { _: false } } : null;
  };

export const checkForLength =
  (minimumLength: number = 8, maximumLength: number = 64) =>
  (field: FormControl) =>
    field.value.length < minimumLength || field.value.length > maximumLength
      ? { validLength: { _: false } }
      : null;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
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
    checkForLength(),
  ]);
  password2FormControl = new FormControl('', [
    Validators.required,
    checkForEquality(this.password1FormControl),
  ]);

  matcher = new RegisterErrorStateMatcher();

  constructor(
    private translationService: TranslateService,
    public authenticationService: AuthenticationService,
    public notificationService: NotificationService,
    public dialogRef: MatDialogRef<RegisterComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  /**
   * Closes the register dialog on call.
   */
  closeDialog(): void {
    this.dialogRef.close([]);
  }

  /**
   * @inheritDoc
   */
  ngOnInit() {
    // nothing special yet
  }

  register(username: string, password: string): void {
    if (
      this.usernameFormControl.valid &&
      this.username2FormControl.valid &&
      this.password1FormControl.valid &&
      this.password2FormControl.valid
    ) {
      this.authenticationService.register(username, password).subscribe({
        next: () => {
          this.translationService
            .get('register.register-successful')
            .subscribe((message) => {
              this.notificationService.show(message);
            });
          this.dialogRef.close({ username, password });
        },
        error: () => {
          this.translationService
            .get('register.register-request-error')
            .subscribe((message) => {
              this.notificationService.show(message);
            });
        },
      });
    } else {
      this.translationService
        .get('register.register-unsuccessful')
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
  buildRegisterActionCallback(
    userName: HTMLInputElement,
    password: HTMLInputElement,
  ): () => void {
    return () => this.register(userName.value, password.value);
  }
}
