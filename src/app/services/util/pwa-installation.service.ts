import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt = null;
  public installPromptAvailable$ = new BehaviorSubject<boolean>(false);

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
    const snackBarRef = this.snackBar.open(
      'Install this app for a better experience!',
      'Install',
      { duration: 0 }, // Keep the snackbar open indefinitely
    );

    // Handle the "Install" button click
    snackBarRef.onAction().subscribe(() => {
      this.triggerInstallPrompt(); // Trigger the installation prompt
    });

    // Handle the "Dismiss" action (close snackbar manually)
    snackBarRef.afterDismissed().subscribe(() => {
      console.log('Snackbar dismissed by the user.');
      this.installPromptAvailable$.next(false); // Hide further prompts
    });
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
