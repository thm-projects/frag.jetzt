import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DataProtectionComponent } from '../data-protection/data-protection.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { Language } from 'app/services/http/languagetool.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { AppStateService } from 'app/services/state/app-state.service';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss'],
})
export class CookiesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('header')
  dialogTitle: ElementRef;
  confirmButtonType: DialogConfirmActionButtonType =
    DialogConfirmActionButtonType.Primary;
  currentLanguage: Language;
  private destroyer = new ReplaySubject(1);

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CookiesComponent>,
    private ref: ElementRef<HTMLElement>,
    appState: AppStateService,
  ) {
    appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
  }

  ngOnInit() {
    // not really the nicest way but should do its job until a better or native solution was found
    setTimeout(() => document.getElementById('cookie-header').focus(), 400);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      (
        this.ref.nativeElement.getElementsByClassName(
          'mat-dialog-title',
        )[0] as HTMLElement
      ).focus();
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  acceptCookies() {
    this.dialogRef.close(true);
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 500);
  }

  exitApp() {
    this.dialogRef.close(false);
  }

  openDataProtection() {
    this.dialog.open(DataProtectionComponent, {
      width: '90%',
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
