import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { PwaInstallSnackbarComponent } from 'app/components/shared/pwa-install-snackbar/pwa-install-snackbar.component';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt = null;
  public installPromptAvailable$ = new BehaviorSubject<boolean>(false);
  private snackBarRef: MatSnackBarRef<PwaInstallSnackbarComponent> | null =
    null;

  constructor(private snackBar: MatSnackBar) {
    // Listen to the 'beforeinstallprompt' event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault(); // Prevent the default mini-infobar
      this.deferredPrompt = e; // Save the event for later use

      // Check if app is already installed
      if (!this.isAppInstalled()) {
        this.installPromptAvailable$.next(true); // Notify listeners
        this.showInstallSnackbar();
      }
    });
  }

  /**
   * Checks if the app is already installed.
   */
  private isAppInstalled(): boolean {
    // Check for standalone mode using display-mode or navigator.standalone
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)',
    ).matches;

    return !!isStandalone;
  }

  /**
   * Displays the snackbar with installation options.
   */
  private showInstallSnackbar() {
    // Only one snackbar can be opened
    if (this.snackBarRef) {
      return;
    }

    // Dont open a new snackbar if it was dismissed
    if (!this.installPromptAvailable$) {
      return;
    }

    // Open the install Snackbar
    this.snackBarRef = this.snackBar.openFromComponent(
      PwaInstallSnackbarComponent,
      {
        duration: 0,
      },
    );

    // Reset manual dismissal state if replaced by another Snackbar
    this.snackBarRef.afterDismissed().subscribe(() => {
      this.snackBarRef = null;
      // Check if snackbar can be reopened
      if (!this.installPromptAvailable$) {
        this.showInstallSnackbar();
      }
    });
  }

  /**
   * Dismisses the snackbar when button is pressed.
   */
  dismissInstall() {
    this.snackBarRef.dismiss();
    this.installPromptAvailable$.next(false);
  }

  /**
   * Triggers the installation prompt.
   */
  triggerInstallPrompt(): Promise<void> {
    if (!this.deferredPrompt) {
      return Promise.reject('Install prompt is not available');
    }

    return this.deferredPrompt.prompt().then((result) => {
      this.deferredPrompt = null; // Reset the deferred prompt
      if (result.outcome === 'accepted') {
        this.snackBarRef.dismiss();
        this.installPromptAvailable$.next(false);
      }
    });
  }
}
