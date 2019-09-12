import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { themes, themes_meta } from './arsnova-theme.const';
import { Theme } from './Theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themeName = localStorage.getItem('theme');
  private activeThem = new BehaviorSubject(this.themeName);
  private themes: Theme[] = [];

  constructor() {
    // tslint:disable-next-line:forin
    for (const k in themes) {
      this.themes.push(new Theme(
        k,
        themes_meta[k]['name'],
        themes_meta[k]['description'],
        themes[k]['--primary'],
        themes[k],
        themes_meta[k]['order'])
      );
    }
    this.themes.sort((a, b) => {
      if (a.order < b.order) {return -1; } else if (a.order > b.order) {return 1; }
      return 0;
    });
    console.log(this.themes);
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
}
