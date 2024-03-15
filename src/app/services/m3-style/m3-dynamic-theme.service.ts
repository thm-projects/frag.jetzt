import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import {
  applyTheme,
  argbFromHex,
  Theme,
  themeFromSourceColor,
} from '@material/material-color-utilities';

export type M3ThemeType = 'light' | 'dark';

function isM3ThemeType(type: string): type is M3ThemeType {
  return type === 'light' || type === 'dark';
}

/**
 * TODO(lph) make preferred theme default
 */
const _M3_DEFAULT_THEME = 'light';

@Injectable({
  providedIn: 'root',
})
export class M3DynamicThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _themeTypeSubject: BehaviorSubject<M3ThemeType> =
    new BehaviorSubject<M3ThemeType>(this.localThemeType);
  private readonly _themeColorSubject: BehaviorSubject<string> =
    new BehaviorSubject<string>('#42069F');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this._themeTypeSubject.subscribe((theme) => {
        switch (theme) {
          case 'light':
            document.body.classList.remove('dark');
            document.body.classList.add('light');
            break;
          case 'dark':
            document.body.classList.remove('light');
            document.body.classList.add('dark');
            break;
        }
        this.loadColor(this._themeColorSubject.value);
      });
      this.loadColor(this._themeColorSubject.value);
      this._themeColorSubject.subscribe((x) => {
        this.loadColor(x);
      });
    }
  }

  loadColor(color: string) {
    const theme = themeFromSourceColor(argbFromHex(color), []);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme) {
    applyTheme(theme, {
      dark: this.themeType === 'dark',
      target: document.documentElement,
    });
    console.log(document.documentElement);
  }

  private get localThemeType() {
    if (isPlatformBrowser(this.platformId)) {
      const localType = localStorage.getItem('--theme');
      if (localType && isM3ThemeType(localType)) {
        return localType;
      }
    }
    return _M3_DEFAULT_THEME;
  }

  set themeType(type: M3ThemeType) {
    if (this._themeTypeSubject.value !== type) {
      this._themeTypeSubject.next(type);
    }
  }

  get themeType(): M3ThemeType {
    return this._themeTypeSubject.value;
  }

  set themeColor(type: string) {
    if (this._themeColorSubject.value !== type) {
      this._themeColorSubject.next(type);
    }
  }

  get themeColor(): string {
    return this._themeTypeSubject.value;
  }
}
