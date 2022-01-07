import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DeviceInfoService {

  private readonly _isSafari;
  private readonly _userAgentDeviceType;
  private readonly _isMobile = new BehaviorSubject(false);

  constructor() {
    const userAgent = navigator.userAgent;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      // Check if IOS device
      if (/iPhone|iPad|iPod/.test(userAgent)) {
        this._isSafari = true;
      }
      this._userAgentDeviceType = 'mobile';
    } else {
      // Check if Mac
      if (/Macintosh|MacIntel|MacPPC|Mac68k/.test(userAgent)) {
        // Check if Safari browser
        if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
          this._isSafari = true;
        }
      }
      this._userAgentDeviceType = 'desktop';
    }
    this._isSafari = this._isSafari || false;
    const match = window.matchMedia('only screen and (max-device-width: 480px) and (orientation: portrait), ' +
      'only screen and (max-device-height: 480px) and (orientation: landscape)');
    this._isMobile.next(match.matches);
    match.addEventListener('change', (e) => {
      this._isMobile.next(e.matches);
    });
  }

  get isSafari(): boolean {
    return this._isSafari;
  }

  get isUserAgentMobile(): boolean {
    return this._userAgentDeviceType === 'mobile';
  }

  get isUserAgentDesktop(): boolean {
    return this._userAgentDeviceType === 'desktop';
  }

  get userAgentDeviceType(): string {
    return this._userAgentDeviceType;
  }

  get isCurrentlyMobile(): boolean {
    return this._isMobile.value;
  }

  get isCurrentlyDesktop(): boolean {
    return !this._isMobile.value;
  }

  public isMobile(): Observable<boolean> {
    return this._isMobile.asObservable();
  }
}
