import { Injectable } from '@angular/core';
import { map, shareReplay } from 'rxjs';
import { themes, themes_meta } from './arsnova-theme.const';
import { Theme } from './Theme';
import {
  AppStateService,
  ThemeKey,
} from 'app/services/state/app-state.service';
import { DeviceStateService } from 'app/services/state/device-state.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themes: Theme[] = [];

  constructor(
    private appState: AppStateService,
    private device: DeviceStateService,
  ) {
    for (const k of Object.keys(themes)) {
      this.themes.push(new Theme(k, themes[k], themes_meta[k]));
    }
    this.themes.sort((a, b) => a.order - b.order);
  }

  get activeTheme(): Theme {
    return this.getThemeByKey(this.appState.getCurrentAppliedTheme());
  }

  get currentTheme(): Theme {
    return this.getThemeByKey(this.appState.getCurrentTheme());
  }

  public getTheme() {
    return this.appState.appliedTheme$.pipe(
      map((key) => this.getThemeByKey(key)),
      shareReplay(1),
    );
  }

  public activate(name: ThemeKey) {
    const active = this.getThemeByKey(name);
    if (!active) {
      throw new Error('Theme "' + name + '" does not exist!');
    }
    this.appState.changeTheme(name);
  }

  public getThemes(): Theme[] {
    return this.themes.filter(
      (t) => t.meta.availableOnMobile || !this.device.isMobile(),
    );
  }

  public getThemeByKey(key: ThemeKey): Theme {
    for (const theme of this.themes) {
      if (theme.key === key) {
        return theme;
      }
    }
    return null;
  }
}
