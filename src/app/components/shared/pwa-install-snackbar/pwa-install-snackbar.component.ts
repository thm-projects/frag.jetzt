import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component } from '@angular/core';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { PwaService } from 'app/services/util/pwa-installation.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-pwa-install-snackbar',
  imports: [MatButton, MatIcon, NgIf],
  templateUrl: './pwa-install-snackbar.component.html',
  styleUrl: './pwa-install-snackbar.component.scss',
  standalone: true,
})
export class PwaInstallSnackbarComponent {
  protected readonly i18n = i18n;

  constructor(
    private readonly snackBarRef: MatSnackBarRef<PwaInstallSnackbarComponent>,
    private readonly pwaService: PwaService,
  ) {}

  install() {
    this.pwaService.triggerInstallPrompt();
  }

  dismiss() {
    this.pwaService.dismissInstall();
  }

  isIOSSafari(): boolean {
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    return isIOS && isSafari;
  }

  supportsDirectInstall(): boolean {
    return !this.isIOSSafari();
  }

  getInstallPrompt(): string {
    if (this.isIOSSafari()) {
      return this.i18n().iosInstallPrompt;
    }
    return this.i18n().installPrompt;
  }
}
