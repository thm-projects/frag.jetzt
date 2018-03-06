import { Component, Inject, NgModule, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { RegisterComponent } from '../register/register.component';
import { PasswordResetComponent } from '../password-reset/password-reset.component';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit {

  constructor(public dialog: MatDialog) {
  }

  openRegisterDialog(): void {
    const registerDialogRef = this.dialog.open(RegisterComponent, {
      width: '350px'
    });
  }

  openPasswordDialog(): void {
    const passwordDialogref = this.dialog.open(PasswordResetComponent, {
      width: '350px'
    });
  }

  ngOnInit() {
  }

}
