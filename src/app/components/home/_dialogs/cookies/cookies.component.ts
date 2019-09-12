import { Component, OnInit } from '@angular/core';
import { DataProtectionComponent } from '../data-protection/data-protection.component';
import { MatDialog, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss']
})
export class CookiesComponent implements OnInit {

  deviceType: string;
  currentLang: string;


  constructor(private dialog: MatDialog,
              private dialogRef: MatDialogRef<CookiesComponent>) { }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');

    // not really the nicest way but should do its job until a better or native solution was found
    setTimeout(() => document.getElementById('cookie-header').focus(), 400);
  }

  acceptCookies() {
    localStorage.setItem('cookieAccepted', 'true');
    localStorage.setItem('dataProtectionConsent', 'true');
  }

  declineCookies() {
    localStorage.setItem('cookieAccepted', 'false');
    this.dialogRef.close(true);
  }

  openDataProtection() {
  const dialogRef = this.dialog.open(DataProtectionComponent, {
    height: '95%'
  });
  dialogRef.componentInstance.deviceType = this.deviceType;
  }

}
