import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { themes, themes_meta } from './arsnova-theme.const';
import { Theme } from './Theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private activeThem = new BehaviorSubject(localStorage.getItem('theme'));
  private themes: Theme[] = [];

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
    this.themes.sort((a, b) => {
      if (a.order < b.order) {
        return -1;
      } else if (a.order > b.order) {
        return 1;
      }
      return 0;
    });
    const isDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
    let currentTheme = this.currentThemeName;
    const selectedTheme = this.themes.find(elem => elem.key === currentTheme);
    if (!currentTheme || !selectedTheme || selectedTheme.isDark !== isDark) {
      for (let i = this.themes.length - 1; i > 0; i--) {
        const theme = this.themes[i];
        if (theme.isDark === isDark) {
          currentTheme = theme.key;
          break;
        }
      }
      this.activate(currentTheme);
    }
  }

  get currentThemeName(): string {
    return this.activeThem.value;
  }

  get currentTheme(): Theme {
    return this.getThemeByKey(this.currentThemeName);
  }

  public getTheme() {
    return this.activeThem.asObservable();
  }

  public activate(name) {
    this.activeThem.next(name);
    localStorage.setItem('theme', name);
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
}
