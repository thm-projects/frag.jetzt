import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component } from '@angular/core';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { PwaService } from 'app/services/util/pwa-installation.service';
import { MatButton } from '@angular/material/button';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-pwa-install-snackbar',
  imports: [MatButton, MatIcon, MatIconButton],
  templateUrl: './pwa-install-snackbar.component.html',
  styleUrl: './pwa-install-snackbar.component.scss',
})
export class PwaInstallSnackbarComponent {
  protected readonly i18n = i18n;
  constructor(
    private snackBarRef: MatSnackBarRef<PwaInstallSnackbarComponent>,
    private pwaService: PwaService,
  ) {}

  install() {
    this.pwaService.triggerInstallPrompt();
  }

  dismiss() {
    this.pwaService.dismissInstall(); // Simply close the snackbar
  }
}
