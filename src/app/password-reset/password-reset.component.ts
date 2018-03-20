import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AuthenticationService } from '../authentication.service';
import { NotificationService } from '../notification.service';
import { RegisterComponent } from '../register/register.component';

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

  constructor(public authenticationService: AuthenticationService,
              public notificationService: NotificationService,
              public dialogRef: MatDialogRef<RegisterComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
  }

  resetPassword(username: string): void {
    username = username.trim();

    if (!this.usernameFormControl.hasError('required') && !this.usernameFormControl.hasError('email')) {
      this.authenticationService.resetPassword(username).subscribe(() => {
        this.notificationService.show('Password was reset. Please check your mail!');
        this.dialogRef.close();
      });
    } else {
      this.notificationService.show('Please fit the requirements shown above.');
    }
  }

}
