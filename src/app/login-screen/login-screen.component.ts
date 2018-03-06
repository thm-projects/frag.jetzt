import { Component, Inject, NgModule, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss']
})
export class LoginScreenComponent implements OnInit {

  constructor(public registerDialog: MatDialog) {
  }

  openRegisterDialog(): void {
    const registerDialogRef = this.registerDialog.open(RegisterComponent, {
      width: '350px'
    });
  }

  ngOnInit() {
  }

}
