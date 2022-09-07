import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { themes, themes_meta } from './arsnova-theme.const';
import { Theme } from './Theme';
import { DeviceInfoService } from '../app/services/util/device-info.service';
import { ConfigurationService } from '../app/services/util/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _currentTheme = null;
  private replaySubject = new ReplaySubject<Theme>(1);
  private themes: Theme[] = [];
  private _activeTheme: Theme = null;
  private _initialized = false;

  constructor(
    private deviceInfo: DeviceInfoService,
    private configurationService: ConfigurationService,
  ) {
  }

  get activeTheme(): Theme {
    return this._activeTheme;
  }

  get currentTheme(): Theme {
    return this._currentTheme;
  }

  init(savedTheme: string) {
    if (this._initialized) {
      return;
    }
    for (const k of Object.keys(themes)) {
      if (!themes_meta[k].availableOnMobile && this.deviceInfo.isCurrentlyMobile) {
        continue;
      }
      this.themes.push(new Theme(
        k,
        themes[k],
        themes_meta[k])
      );
    }
    this.themes.sort((a, b) => a.order - b.order);
    this.deviceInfo.isDark().subscribe(() => {
      if (this._activeTheme?.key === 'systemDefault') {
        this.updateBySystem();
      }
    });
    this.activate(savedTheme || 'dark');
    this._initialized = true;
  }

  public getTheme() {
    return this.replaySubject.asObservable();
  }

  public activate(name) {
    const active = this.getThemeByKey(name);
    if (!active) {
      throw new Error('Theme "' + name + '" does not exist!');
    }
    this._activeTheme = active;
    this.configurationService.put('theme', name).subscribe();
    if (name === 'systemDefault') {
      this.updateBySystem();
    } else {
      this.replaySubject.next(this._activeTheme);
      this._currentTheme = this._activeTheme;
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
    const name = this._activeTheme.meta.config[this.deviceInfo.isCurrentlyDark ? 'dark' : 'light'];
    const theme = this.getThemeByKey(name);
    if (!theme) {
      throw new Error('Theme "' + name + '" does not exist!');
    }
    this.replaySubject.next(theme);
    this._currentTheme = theme;
  }
}
