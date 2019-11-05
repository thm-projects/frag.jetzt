import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataProtectionComponent } from '../data-protection/data-protection.component';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss']
})
export class CookiesComponent implements OnInit, AfterViewInit {

  @ViewChild('header')
  dialogTitle: ElementRef;

  deviceType: string;
  currentLang: string;

  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Primary;

  constructor(private dialog: MatDialog, private dialogRef: MatDialogRef<CookiesComponent>, private ref: ElementRef) {
  }

  ngOnInit() {

    this.currentLang = localStorage.getItem('currentLang');

    // not really the nicest way but should do its job until a better or native solution was found
    setTimeout(() => document.getElementById('cookie-header').focus(), 400);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      (<HTMLElement>(<HTMLElement>this.ref.nativeElement).getElementsByClassName('mat-dialog-title')[0]).focus();
    }, 500);
  }

  acceptCookies() {
    localStorage.setItem('cookieAccepted', 'true');
    localStorage.setItem('dataProtectionConsent', 'true');
    this.dialogRef.close(true);
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 500);
  }

  exitApp() {
    localStorage.setItem('cookieAccepted', 'false');
    // TODO somehow exit the app, since the user didn't accept cookie usage
    this.dialogRef.close(false);
  }

  openDataProtection() {
    const dialogRef = this.dialog.open(DataProtectionComponent, {
      width: '90%'
    });
    dialogRef.componentInstance.deviceType = this.deviceType;
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildConfirmActionCallback(): () => void {
    return () => this.acceptCookies();
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.exitApp();
  }
}
