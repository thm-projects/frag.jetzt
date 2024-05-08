import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import {
  argbFromHex,
  CustomColor,
  Theme,
  themeFromSourceColor,
} from '@material/material-color-utilities';
import { HttpClient } from '@angular/common/http';
import {
  isM3ThemeType,
  M3CustomColorData,
  M3DynamicColorState,
  M3DynamicThemeUtility,
  M3PaletteRequirement,
  M3ThemeType,
} from './m3-dynamic-theme-utility';
import { catchError } from 'rxjs/operators';
import { actualTheme, setTheme } from 'app/base/theme/theme';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * TODO(lph) make preferred theme default
 */
const _M3_DEFAULT_THEME = 'light';

@Injectable({
  providedIn: 'root',
})
export class M3DynamicThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly _themeTypeSubject: Observable<M3ThemeType> =
    toObservable(actualTheme);
  private readonly _themeColorSubject: BehaviorSubject<string> =
    new BehaviorSubject<string>('#42069F');
  private readonly _paletteRequirement: BehaviorSubject<M3PaletteRequirement> =
    new BehaviorSubject<M3PaletteRequirement>({});
  private readonly _customColors: BehaviorSubject<CustomColor[]> =
    new BehaviorSubject<CustomColor[]>([]);
  private readonly _m3CustomColors: BehaviorSubject<M3CustomColorData> =
    new BehaviorSubject<M3CustomColorData>({});
  private readonly _currentTheme: BehaviorSubject<Theme | undefined> =
    new BehaviorSubject<Theme | undefined>(undefined);
  private m3DynamicColorState: M3DynamicColorState;

  constructor(http: HttpClient) {
    this._m3CustomColors.subscribe((data) => {
      this._customColors.next(
        Object.entries(data).map(([key, value]) => {
          return {
            name: key,
            value: argbFromHex(value.base),
            blend: true,
          };
        }),
      );
    });
    http
      .get<M3CustomColorData>('assets/modules/m3/custom-colors.json')
      .pipe(
        catchError((err) => {
          console.error(err);
          throw new Error(err);
        }),
      )
      .subscribe((data) => this._m3CustomColors.next(data));
    http
      .get<M3PaletteRequirement>('assets/modules/m3/palette-codes.json')
      .pipe(
        catchError((err) => {
          console.error(err);
          throw new Error(err);
        }),
      )
      .subscribe((data) => {
        this._paletteRequirement.next(data);
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
      });
  }

  createColorState(color: string) {
    this.m3DynamicColorState = {
      current: color,
      prev: this.m3DynamicColorState,
    };
    return this.m3DynamicColorState;
  }

  loadColor(color: string) {
    if (!this.m3DynamicColorState) {
      this.m3DynamicColorState = {
        current: color,
        prev: undefined,
      };
    }
    const theme = themeFromSourceColor(
      argbFromHex(color),
      this._customColors.value,
    );
    this.applyTheme(theme);
  }

  destroyColorState(state: M3DynamicColorState) {
    if (state.prev) {
      this.loadColor(state.prev.current);
      this.m3DynamicColorState = state.prev;
    }
  }

  private applyTheme(theme: Theme) {
    if (
      !this._currentTheme.value ||
      this._currentTheme.value.source !== theme.source ||
      JSON.stringify(this._currentTheme.value) !== JSON.stringify(theme)
    ) {
      M3DynamicThemeUtility.applyTheme({
        themeType: actualTheme(),
        paletteRequirements: this._paletteRequirement.value,
        theme: theme,
        customColors: this._m3CustomColors.value,
        target: document.documentElement,
      });
    }
  }

  private get localThemeType(): M3ThemeType {
    if (isPlatformBrowser(this.platformId)) {
      const localType = localStorage.getItem('--theme');
      if (localType && isM3ThemeType(localType)) {
        return localType;
      }
    }
    return _M3_DEFAULT_THEME;
  }

  set themeType(type: M3ThemeType) {
    setTheme(type);
  }

  get themeType(): M3ThemeType {
    return actualTheme();
  }

  set themeColor(type: string) {
    if (this._themeColorSubject.value !== type) {
      this._themeColorSubject.next(type);
    }
  }

  get themeColor(): string {
    return this._themeColorSubject.value;
  }
}
