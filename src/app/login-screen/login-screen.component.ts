import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { RegisterComponent } from '../register/register.component';
import { PasswordResetComponent } from '../password-reset/password-reset.component';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit {

  result: any;

  constructor(public dialog: MatDialog) {
  }

  openRegisterDialog(): void {
    const registerDialogRef = this.dialog.open(RegisterComponent, {
      width: '350px'
    });

    registerDialogRef.afterClosed().subscribe(result => {
      console.log('RegisterDialog was closed');
      this.result = result;
    });
  }

  openPasswordDialog(): void {
    const passwordResetDialogRef = this.dialog.open(PasswordResetComponent, {
      width: '350px'
    });

    passwordResetDialogRef.afterClosed().subscribe(result => {
      console.log('PasswordResetDialog was closed');
      this.result = result;
    });
  }

  ngOnInit() {
  }

}
