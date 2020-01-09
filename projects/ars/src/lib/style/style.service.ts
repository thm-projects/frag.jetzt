import { Injectable } from '@angular/core';
import { dark, light } from './style.const';

@Injectable({
  providedIn: 'root'
})
export class StyleService {

  public static light = light;
  public static dark = dark;

  private colors: any;

  constructor() {
    this.colors = light;
    this.initColor();
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
