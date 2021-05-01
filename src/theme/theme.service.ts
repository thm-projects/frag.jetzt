import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { themes, themes_meta } from './arsnova-theme.const';
import { Theme, ThemeTranslationList } from './Theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themeName = localStorage.getItem('theme');
  private activeThem = new BehaviorSubject(this.themeName);
  private themes: Theme[] = [];

  constructor() {
    // eslint-disable-next-line guard-for-in
    for (const k in themes) {
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
