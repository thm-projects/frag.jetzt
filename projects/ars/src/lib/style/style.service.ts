import { Injectable } from '@angular/core';
import { dark, light } from './style.const';
import { ThemeService } from '../../../../../src/theme/theme.service';

@Injectable({
  providedIn: 'root'
})
export class StyleService {

  public static light = light;
  public static dark = dark;

  private colors: any;

  constructor(
    private themeService: ThemeService
  ) {
    this.themeService.getTheme().subscribe(_ => this.setColor(themeService.currentTheme.isDark));
  }

  public setColor(isDark: boolean) {
    if (isDark) {
      this.colors = dark;
    } else {
      this.colors = light;
    }
    this.initColor();
  }

  private initColor() {
    for (const k in this.colors) {
      if (this.colors.hasOwnProperty(k)) {
        document.documentElement.style.setProperty('--' + k, this.colors[k]);
      }
    }
  }

}
