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
  private manuallyDismissed = false;

  constructor(private snackBar: MatSnackBar) {
    // Listen to the 'beforeinstallprompt' event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault(); // Prevent the default mini-infobar
      this.deferredPrompt = e; // Save the event for later use

      // Check if app is already installed
      if (!this.isAppInstalled()) {
        this.installPromptAvailable$.next(true); // Notify listeners
        this.showInstallSnackbar(); // Show the snackbar to the user
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
    this.snackBarRef = this.snackBar.openFromComponent(
      PwaInstallSnackbarComponent,
      { duration: 0 }, // Keep the snackbar open indefinitely
    );
  }

  dismissInstall() {
    this.manuallyDismissed = true;
    this.snackBarRef.dismiss();
    this.installPromptAvailable$.next(false);
    // Handle the "Dismiss" action (close snackbar manually)
  }

  /**
   * Triggers the installation prompt.
   */
  triggerInstallPrompt(): Promise<void> {
    if (!this.deferredPrompt) {
      return Promise.reject('Install prompt is not available');
    }

    return this.deferredPrompt.prompt().then(() => {
      this.deferredPrompt = null; // Reset the deferred prompt
      this.installPromptAvailable$.next(false); // Update state
    });
  }
}
