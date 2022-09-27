import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { themes, themes_meta } from './arsnova-theme.const';
import { Theme } from './Theme';
import { DeviceInfoService } from '../app/services/util/device-info.service';
import { ConfigurationService } from '../app/services/util/configuration.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _currentTheme: Theme = null;
  private replaySubject = new ReplaySubject<Theme>(1);
  private themes: Theme[] = [];
  private _activeTheme: Theme = null;
  private _initialized = false;
  private _style: HTMLStyleElement;
  private _textNode: Text;

  constructor(
    private deviceInfo: DeviceInfoService,
    private configurationService: ConfigurationService,
    private httpClient: HttpClient,
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
    this._style = document.createElement('style');
    document.head.append(this._style);
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
      this.setCurrentTheme(this._activeTheme);
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
    this.setCurrentTheme(theme);
  }

  private setCurrentTheme(theme: Theme) {
    this._currentTheme = theme;
    this.replaySubject.next(theme);
    this.get(theme.meta.highlightJsClass).subscribe(data => {
      this._textNode?.remove();
      this._textNode = document.createTextNode(data);
      this._style.append(this._textNode);
    });
  }

  private get(name: string): Observable<string> {
    return this.httpClient.get('/assets/styles/highlight-js/' + name, {
      responseType: 'text',
    }).pipe(
      tap(() => ''),
    );
  }
}
