import { Component, signal } from '@angular/core';
import { DataProtectionComponent } from '../data-protection/data-protection.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { language } from 'app/base/language/language';
import {
  appleUrl,
  badgeType,
  getAppStoreBadge,
  getPlayStoreBadge,
  googleUrl,
} from '../app-utility';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss'],
  standalone: false,
})
export class CookiesComponent {
  protected readonly lang = language;
  protected readonly isMobile = signal(false);
  protected readonly badgeType = badgeType;
  protected readonly getAppStoreBadge = getAppStoreBadge;
  protected readonly getPlayStoreBadge = getPlayStoreBadge;
  protected readonly googleUrl = googleUrl;
  protected readonly appleUrl = appleUrl;

  constructor(
    protected dialog: MatDialog,
    private dialogRef: MatDialogRef<CookiesComponent>,
  ) {}

  acceptCookies() {
    this.dialogRef.close(true);
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 500);
  }

  openDataProtection() {
    this.dialog.open(DataProtectionComponent);
  }
}
