import { Component, OnInit } from '@angular/core';
import { DataProtectionComponent } from '../data-protection/data-protection.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { language } from 'app/base/language/language';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { isDark } from '../../../../base/theme/theme';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.component.html',
  styleUrls: ['./cookies.component.scss'],
})
export class CookiesComponent implements OnInit {
  protected readonly lang = language;
  isMobile: boolean = false;
  isAndroid: boolean = false;
  isIOS: boolean = false;
  isPWA: boolean = window.matchMedia('(display-mode: standalone)').matches;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CookiesComponent>,
    private breakpointObserver: BreakpointObserver,
  ) {}

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches; // This will be true if the device is a phone
      });

    this.isAndroid = /Android/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  getAppStoreBadge(language: string): string {
    if (language === 'de') {
      if (isDark()) {
        return 'assets/images/appstore_de_white.svg';
      } else {
        return 'assets/images/appstore_de_black.svg';
      }
    } else if (language === 'en') {
      if (isDark()) {
        return 'assets/images/appstore_en_white.svg';
      } else {
        return 'assets/images/appstore_en_black.svg';
      }
    } else if (language === 'fr') {
      if (isDark()) {
        return 'assets/images/appstore_fr_white.svg';
      } else {
        return 'assets/images/appstore_fr_black.svg';
      }
    }
    return 'assets/images/appstore_de_black.svg';
  }

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
