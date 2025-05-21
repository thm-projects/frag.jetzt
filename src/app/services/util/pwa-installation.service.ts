import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { PwaInstallSnackbarComponent } from 'app/components/shared/pwa-install-snackbar/pwa-install-snackbar.component';
import { BehaviorSubject } from 'rxjs';
import { BrowserDetectionService } from './browser-detection.service';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private deferredPrompt: any = null;
  public installPromptAvailable$ = new BehaviorSubject<boolean>(false);
  private snackBarRef: MatSnackBarRef<PwaInstallSnackbarComponent> | null =
    null;
  private readonly PROMPT_SHOWN_KEY = 'fj-pwa-prompt-shown';
  private readonly LAST_PROMPT_TIME_KEY = 'fj-pwa-last-prompt-time';
  private readonly PROMPT_DELAY_MS = 30 * 60 * 1000; // 30 minutes

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly browserDetection: BrowserDetectionService,
  ) {
    // Initialize event handling only if browser supports PWAs
    if (this.browserDetection.hasBeforeInstallPromptSupport()) {
      this.initInstallPromptEvent();
    }

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      localStorage.setItem('pwa-installed', 'true');
    });
  }

  /**
   * Initializes the install prompt event listener
   */
  private initInstallPromptEvent() {
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
    // Already installed or dismissed?
    if (this.isAppInstalled() || this.isDismissed()) {
      return false;
    }

    // Check if this is the first visit (tracking not yet initialized)
    const isVisitTracked = localStorage.getItem('visitTracking') === 'true';

    // If first visit: initialize tracking and DO NOT show
    if (!isVisitTracked) {
      localStorage.setItem('visitTracking', 'true');
      localStorage.setItem('firstVisitTimestamp', Date.now().toString());
      return false; // Don't show on first visit
    }

    // From here we know: This is at least the second visit

    // Check time delay after first visit (e.g. 10 minutes)
    const firstVisitTimestamp = localStorage.getItem('firstVisitTimestamp');
    if (firstVisitTimestamp) {
      const timeElapsed = Date.now() - parseInt(firstVisitTimestamp, 10);
      const tenMinutesInMs = 10 * 60 * 1000;
      if (timeElapsed < tenMinutesInMs) {
        return false; // Less than 10 minutes passed since first visit
      }
    }

    // Check 30-minute delay after 'Later' button
    const lastPromptTime = localStorage.getItem('fj-pwa-last-prompt-time');
    if (lastPromptTime) {
      const timeElapsed = Date.now() - parseInt(lastPromptTime, 10);
      const thirtyMinutesInMs = 30 * 60 * 1000;
      return timeElapsed > thirtyMinutesInMs;
    }

    // For returning users with no previous prompt: show
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
    return localStorage.getItem('pwa-installed') === 'true';
  }

  /**
   * Checks if the browser is PWA capable but installation isn't supported directly
   * (like Safari on iOS where manual A2HS is needed)
   */
  isManualInstallNeeded(): boolean {
    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(ua);

    return (
      isIOS &&
      isSafari &&
      this.browserDetection.isPwaSupported() &&
      !this.browserDetection.hasBeforeInstallPromptSupport()
    );
  }

  /**
   * Checks if browser is Safari on iOS (needs manual install instructions)
   */
  isIOSSafari(): boolean {
    return this.browserDetection.isIOSSafari();
  }

  /**
   * Checks if direct installation is supported
   */
  supportsDirectInstall(): boolean {
    return this.browserDetection.hasBeforeInstallPromptSupport();
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
   * Show correct installation instructions based on browser
   */
  showInstallInstructions(): void {
    if (this.isManualInstallNeeded()) {
      // Show iOS-specific instructions
      this.snackBar.open(
        'Zum Installieren: Tippe auf "Teilen" und dann auf "Zum Home-Bildschirm"',
        'OK',
        { duration: 10000 },
      );
    }
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

  /**
   * Checks if the installation prompt was dismissed
   */
  private isDismissed(): boolean {
    return localStorage.getItem('pwa-install-dismissed') === 'true';
  }
}
