import { AfterContentInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataProtectionComponent } from '../data-protection/data-protection.component';
import { MatDialog, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss']
})
export class CookiesComponent implements OnInit, AfterContentInit {

  @ViewChild('header')
  dialogTitle: ElementRef;

  deviceType: string;
  currentLang: string;


  constructor(private dialog: MatDialog, private dialogRef: MatDialogRef<CookiesComponent>) {
  }

  ngAfterContentInit() {
    const elem: HTMLElement = this.dialogTitle.nativeElement;
    elem.focus();
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
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
    width: '60%'
  });
  dialogRef.componentInstance.deviceType = this.deviceType;
  }

}
