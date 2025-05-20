import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class BrowserDetectionService {
  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  /**
   * Checks if the current browser supports PWA installation
   */
  isPwaSupported(): boolean {
    // Check if we're running in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const ua = navigator.userAgent;

    // Safari on iOS 16.4+ has better PWA support
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isMacOS = /Mac/.test(ua) && !/iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);

    // Chrome, Edge, Samsung Browser and Android browsers have good PWA support
    const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);
    const isEdge = /Edge|Edg/.test(ua);
    const isSamsung = /SamsungBrowser/.test(ua);
    const isAndroidBrowser = /Android/.test(ua);

    // Firefox has limited PWA support
    const isFirefox = /Firefox|FxiOS/.test(ua);

    // Opera is Chromium-based and supports PWAs
    const isOpera = /OPR/.test(ua);

    // iOS Safari above version 16.4 has better PWA support
    if (isIOS && isSafari) {
      const match = ua.match(/Version\/(\d+)/);
      const version = match ? parseInt(match[1], 10) : 0;
      return version >= 16;
    }

    // macOS Safari has limited support
    if (isMacOS && isSafari) {
      return false; // Most PWA features don't work well on macOS Safari
    }

    // Firefox limited support
    if (isFirefox) {
      return isAndroidBrowser; // Only Android Firefox has moderate PWA support
    }

    // These browsers have good PWA support
    return isChrome || isEdge || isSamsung || isOpera;
  }

  /**
   * Checks if the browser is Safari on iOS that needs manual installation
   */
  isIOSSafari(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const ua = navigator.userAgent;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(ua);

    return isIOS && isSafari;
  }

  /**
   * Checks if the browser supports the BeforeInstallPrompt event
   */
  hasBeforeInstallPromptSupport(): boolean {
    return (
      isPlatformBrowser(this.platformId) && 'BeforeInstallPromptEvent' in window
    );
  }
}
