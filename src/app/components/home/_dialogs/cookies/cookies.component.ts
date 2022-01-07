import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataProtectionComponent } from '../data-protection/data-protection.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  DialogConfirmActionButtonType
} from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { EventService } from '../../../../services/util/event.service';
import { LanguageService } from '../../../../services/util/language.service';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss']
})
export class CookiesComponent implements OnInit, AfterViewInit {

  @ViewChild('header')
  dialogTitle: ElementRef;
  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Primary;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CookiesComponent>,
    private ref: ElementRef<HTMLElement>,
    private eventService: EventService,
    public langService: LanguageService,
  ) {
  }

  ngOnInit() {
    // not really the nicest way but should do its job until a better or native solution was found
    setTimeout(() => document.getElementById('cookie-header').focus(), 400);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      (this.ref.nativeElement.getElementsByClassName('mat-dialog-title')[0] as HTMLElement).focus();
    }, 500);
  }

  acceptCookies() {
    localStorage.setItem('cookieAccepted', 'true');
    this.eventService.broadcast('dataProtectionConsentUpdate', true);
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
    this.dialog.open(DataProtectionComponent, {
      width: '90%'
    });
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
