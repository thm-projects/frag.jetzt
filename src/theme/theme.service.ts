import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { themes, themes_meta } from './arsnova-theme.const';
import { Theme } from './Theme';

const LOCAL_THEME_KEY = 'currentActiveTheme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<Theme>(null);
  private themes: Theme[] = [];
  private _activeTheme: Theme = null;
  private _isSystemDark = false;

  constructor() {
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 499px)').matches;
    // eslint-disable-next-line guard-for-in
    for (const k in themes) {
      if (!themes_meta[k].availableOnMobile && isMobile) {
        continue;
      }
      this.themes.push(new Theme(
        k,
        themes[k],
        themes_meta[k])
      );
    }
    this.themes.sort((a, b) => a.order - b.order);
    const darkMatch = window.matchMedia('(prefers-color-scheme: dark)');
    this._isSystemDark = darkMatch.matches;
    darkMatch.addEventListener('change', e => {
      this._isSystemDark = e.matches;
      if (this._activeTheme?.key === 'systemDefault') {
        this.updateBySystem();
      }
    });
    this.activate(ThemeService.getActiveThemeConfig() || 'dark');
  }

  private static getActiveThemeConfig(): string {
    return localStorage.getItem(LOCAL_THEME_KEY);
  }

  private static setActiveThemeConfig(themeKey: string): void {
    localStorage.setItem(LOCAL_THEME_KEY, themeKey);
  }

  get activeTheme(): Theme {
    return this._activeTheme;
  }

  get currentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  public getTheme() {
    return this.currentThemeSubject.asObservable();
  }

  public activate(name) {
    this._activeTheme = this.getThemeByKey(name);
    if (!this._activeTheme) {
      throw new Error('Theme "' + name + '" does not exist!');
    }
    ThemeService.setActiveThemeConfig(name);
    if (name === 'systemDefault') {
      this.updateBySystem();
    } else {
      this.currentThemeSubject.next(this._activeTheme);
    }
  }

  public getThemes(): Theme[] {
    return this.themes;
  }

  public getThemeByKey(key: string): Theme {
    for (const theme of this.themes) {
      if (theme.key === key) {
        return theme;
      }
    }
    return null;
  }

  private updateBySystem() {
    const name = this._activeTheme.meta.config[this._isSystemDark ? 'dark' : 'light'];
    const theme = this.getThemeByKey(name);
    if (!theme) {
      throw new Error('Theme "' + name + '" does not exist!');
    }
    this.currentThemeSubject.next(theme);
  }
}
