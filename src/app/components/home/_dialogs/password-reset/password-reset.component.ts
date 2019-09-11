import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RegisterComponent } from '../register/register.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from '../../../../services/util/event.service';

export class PasswordResetErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return (control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent implements OnInit {


  usernameFormControl = new FormControl('', [Validators.required, Validators.email]);

  matcher = new PasswordResetErrorStateMatcher();

  constructor(private translationService: TranslateService,
              public authenticationService: AuthenticationService,
              public notificationService: NotificationService,
              public dialogRef: MatDialogRef<RegisterComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              public eventService: EventService) {
  }

  ngOnInit() {
  }


  /**
   * Closes the room create dialog on call.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }


  resetPassword(username: string): void {
    username = username.trim();

    if (!this.usernameFormControl.hasError('required') && !this.usernameFormControl.hasError('email')) {
      this.authenticationService.resetPassword(username).subscribe(() => {
        this.translationService.get('password-reset.reset-successful').subscribe(message => {
          this.notificationService.show(message);
        });
        this.closeDialog();
      });
    } else {
      this.translationService.get('password-reset.input-incorrect').subscribe(message => {
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
}
