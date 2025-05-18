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
  private readonly PROMPT_SHOWN_KEY = 'fj-pwa-prompt-shown';
  private readonly LAST_PROMPT_TIME_KEY = 'fj-pwa-last-prompt-time';
  private readonly PROMPT_DELAY_MS = 30 * 60 * 1000; // 30 minutes

  constructor(private readonly snackBar: MatSnackBar) {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;

      if (!this.isAppInstalled() && this.shouldShowInstallPrompt()) {
        this.installPromptAvailable$.next(true);
        this.showInstallSnackbar();
      }
    });
  }

  /**
   * Checks if the PWA installation prompt should be shown
   */
  private shouldShowInstallPrompt(): boolean {
    if (localStorage.getItem('pwa-install-dismissed') === 'true') {
      return false;
    }

    const lastPromptTime = localStorage.getItem(this.LAST_PROMPT_TIME_KEY);
    if (lastPromptTime) {
      const timeSinceLastPrompt = Date.now() - Number(lastPromptTime);
      if (timeSinceLastPrompt < this.PROMPT_DELAY_MS) {
        return false;
      }
    }

    return true;
  }

  /**
   * Resets the installation prompt preferences
   */
  resetInstallPrompt() {
    localStorage.removeItem(this.LAST_PROMPT_TIME_KEY);
    localStorage.removeItem('pwa-install-dismissed');
  }

  /**
   * Checks if the app is already installed
   */
  private isAppInstalled(): boolean {
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)',
    ).matches;

    return !!isStandalone;
  }

  /**
   * Displays the installation snackbar
   */
  private showInstallSnackbar() {
    if (!this.installPromptAvailable$.value) {
      return;
    }

    if (this.snackBarRef) {
      return;
    }

    this.snackBarRef = this.snackBar.openFromComponent(
      PwaInstallSnackbarComponent,
      {
        duration: 0,
      },
    );

    this.snackBarRef.afterDismissed().subscribe(() => {
      this.snackBarRef = null;
      if (this.installPromptAvailable$.value) {
        this.showInstallSnackbar();
      }
    });
  }

  /**
   * Dismisses installation prompt
   */
  dismissInstall(rememberChoice: boolean = false) {
    if (rememberChoice) {
      localStorage.setItem('pwa-install-dismissed', 'true');
    } else {
      localStorage.setItem(this.LAST_PROMPT_TIME_KEY, Date.now().toString());
    }

    this.snackBarRef?.dismiss();
    this.installPromptAvailable$.next(false);
  }

  /**
   * Triggers the installation prompt
   */
  triggerInstallPrompt(): Promise<void> {
    if (!this.deferredPrompt) {
      return Promise.reject(new Error('Install prompt is not available'));
    }

    return this.deferredPrompt.prompt().then((result) => {
      this.deferredPrompt = null;
      if (result.outcome === 'accepted') {
        this.snackBarRef.dismiss();
        this.installPromptAvailable$.next(false);
      }
    });
  }
}
