import { Component, Inject, OnInit } from '@angular/core';
import { ErrorStateMatcher, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../../services/util/event.service';

export class RegisterErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return (control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

export function validatePassword(password1: FormControl) {
  return (formControl: FormControl) => {
    const password1Value = password1.value;
    const password2Value = formControl.value;

    if (password1Value !== password2Value) {
      return {
        passwordIsEqual: {
          isEqual: false
        }
      };
    } else {
      return null;
    }
  };
}

function validateEmail(email1: FormControl) {
  return (formControl: FormControl) => {
    const email1Value = email1.value;
    const email2Value = formControl.value;

    if (email1Value !== email2Value) {
      return {
        emailIsEqual: {
          isEqual: false
        }
      };
    } else {
      return null;
    }
  };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  usernameFormControl = new FormControl('', [Validators.required, Validators.email]);
  username2FormControl = new FormControl('', [Validators.required, validateEmail(this.usernameFormControl)]);
  password1FormControl = new FormControl('', [Validators.required]);
  password2FormControl = new FormControl('', [Validators.required, validatePassword(this.password1FormControl)]);

  matcher = new RegisterErrorStateMatcher();

  constructor(private translationService: TranslateService,
              public authenticationService: AuthenticationService,
              public notificationService: NotificationService,
              public dialogRef: MatDialogRef<RegisterComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public eventService: EventService) {
  }


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
    if (!this.usernameFormControl.hasError('required') && !this.usernameFormControl.hasError('email') &&
      !this.username2FormControl.hasError('required') && !this.username2FormControl.hasError('emailIsEqual') &&
      !this.password1FormControl.hasError('required') &&
      !this.password2FormControl.hasError('required') && !this.password2FormControl.hasError('passwordIsEqual')) {
      this.authenticationService.register(username, password).subscribe(
        (result) => {
          this.translationService.get('register.register-successful').subscribe(message => {
            this.notificationService.show(message);
          });
          this.dialogRef.close({ username: username, password: password });
        },
        err => {
          this.translationService.get('register.register-request-error').subscribe(message => {
            this.notificationService.show(message);
          });
        }
      );
    } else {
      this.translationService.get('register.register-unsuccessful').subscribe(message => {
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
  buildRegisterActionCallback(userName: HTMLInputElement, password: HTMLInputElement): () => void {
    return () => this.register(userName.value, password.value);
  }
}
