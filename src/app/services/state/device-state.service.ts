import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeviceStateService {
  readonly mobile$: Observable<boolean>;
  readonly dark$: Observable<boolean>;
  readonly isSafari: boolean;
  readonly deviceType: 'mobile' | 'desktop';
  private readonly mobileBehaviour$ = new BehaviorSubject<boolean>(false);
  private readonly darkBehaviour$ = new BehaviorSubject<boolean>(false);

  constructor() {
    const match = window.matchMedia(
      'only screen and (max-device-width: 480px) and (orientation: portrait), ' +
        'only screen and (max-device-height: 480px) and (orientation: landscape)',
    );
    this.mobileBehaviour$.next(match.matches);
    match.addEventListener('change', (e) => {
      this.mobileBehaviour$.next(e.matches);
    });
    this.mobile$ = this.mobileBehaviour$;
    const dark = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkBehaviour$.next(dark.matches);
    dark.addEventListener('change', (e) => {
      this.darkBehaviour$.next(e.matches);
    });
    this.dark$ = this.darkBehaviour$;
    // safari stuff
    const userAgent = navigator.userAgent;
    let isSafari = false;
    let deviceType: 'mobile' | 'desktop' = 'mobile';
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      )
    ) {
      // Check if IOS device
      if (/iPhone|iPad|iPod/.test(userAgent)) {
        isSafari = true;
      }
      deviceType = 'mobile';
    } else {
      // Check if Mac
      if (/Macintosh|MacIntel|MacPPC|Mac68k/.test(userAgent)) {
        // Check if Safari browser
        if (
          userAgent.indexOf('Safari') !== -1 &&
          userAgent.indexOf('Chrome') === -1
        ) {
          isSafari = true;
        }
      }
      deviceType = 'desktop';
    }
    this.isSafari = isSafari;
    this.deviceType = deviceType;
  }

  isMobile() {
    return this.mobileBehaviour$.value;
  }

  isDark() {
    return this.darkBehaviour$.value;
  }
}
