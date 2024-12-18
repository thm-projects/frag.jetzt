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
  constructor(
    private snackBarRef: MatSnackBarRef<PwaInstallSnackbarComponent>,
    private pwaService: PwaService,
  ) {}

  install() {
    this.pwaService.triggerInstallPrompt();
    this.snackBarRef.dismiss(); // Close snackbar after installation
  }

  dismiss() {
    this.snackBarRef.dismiss(); // Simply close the snackbar
  }
}
