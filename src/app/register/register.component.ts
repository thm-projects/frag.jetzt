import { Component, Inject, OnInit } from '@angular/core';
import { ErrorStateMatcher, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { AuthenticationService } from '../authentication.service';
import { NotificationService } from '../notification.service';
import { Router } from '@angular/router';

export class RegisterErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return (control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

function validatePassword(password1: FormControl) {
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

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  usernameFormControl = new FormControl('', [Validators.required, Validators.email]);
  password1FormControl = new FormControl('', [Validators.required]);
  password2FormControl = new FormControl('', [Validators.required, validatePassword(this.password1FormControl)]);

  matcher = new RegisterErrorStateMatcher();

  constructor(public authenticationService: AuthenticationService,
              public notificationService: NotificationService,
              public dialogRef: MatDialogRef<RegisterComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
  }

  register(username: string, password1: string): void {
    if (!this.usernameFormControl.hasError('required') && !this.usernameFormControl.hasError('email') &&
      !this.password1FormControl.hasError('required') &&
      !this.password2FormControl.hasError('required') && !this.password2FormControl.hasError('passwordIsEqual')) {
      // ToDo: Check return type of register route
      this.authenticationService.register(username, password1).subscribe(result => {
        // ToDo: Check what /api/register returns and check for potential errors
        this.notificationService.show('Successfully registered. Please check your mail!');
        this.dialogRef.close();
      });
    } else {
      this.notificationService.show('Please fit the requirements shown above.');
    }
  }
}
