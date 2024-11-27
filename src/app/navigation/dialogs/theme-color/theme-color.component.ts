import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  AfterViewChecked,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { actualTheme, setTheme, theme } from 'app/base/theme/theme';
import { MatCardModule } from '@angular/material/card';
import {
  DEFAULT_COLOR,
  setThemeSourceColor,
  themeSourceColor,
} from 'app/base/theme/apply-system-variables';
import { actualContrast, setContrast } from 'app/base/theme/contrast';

@Component({
  selector: 'app-theme-color',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './theme-color.component.html',
  styleUrl: './theme-color.component.scss',
})
export class ThemeColorComponent implements AfterViewChecked {
  protected readonly dotStyle = computed(() => `left: ${this.dist()}px;`);
  protected readonly i18n = i18n;
  protected readonly theme = signal(actualTheme());
  protected readonly contrast = signal(actualContrast());
  private container = viewChild('container', {
    read: ElementRef<HTMLDivElement>,
  });
  private ref = inject(MatDialogRef<ThemeColorComponent>);
  private startColor = themeSourceColor();
  private beforeTheme = theme();
  private beforeContrast = actualContrast();
  private dist = signal(0);
  private hue = signal(0);

  constructor() {
    this.hue.set(this.hexToHue(this.startColor));
    effect((onCleanup) => {
      setTheme(this.theme());
      onCleanup(() => setTheme(this.beforeTheme));
    });
    effect((onCleanup) => {
      setContrast(this.contrast());
      onCleanup(() => setContrast(this.beforeContrast));
    });
    effect((onCleanup) => {
      setThemeSourceColor(this.hueToHex(this.hue()));
      onCleanup(() => setThemeSourceColor(this.startColor));
    });
  }

  ngAfterViewChecked(): void {
    const w = this.container().nativeElement.getBoundingClientRect().width;
    this.dist.set((this.hue() * w) / 360);
  }

  protected onMouse(
    container: HTMLDivElement,
    e: MouseEvent,
    checkButtons: boolean,
  ): void {
    e.stopPropagation();
    if (checkButtons && e.buttons === 0) {
      return;
    }
    const rect = container.getBoundingClientRect();
    let distance = e.clientX - rect.left;
    if (distance < 0) {
      distance = 0;
    } else if (distance > rect.width) {
      distance = rect.width;
    }
    this.dist.set(distance);
    const hue = (distance * 360) / rect.width;
    this.hue.set(hue);
  }

  protected onTouch(container: HTMLDivElement, e: TouchEvent): void {
    e.stopPropagation();
    const touch = e.touches[0] || e.changedTouches[0];
    const rect = container.getBoundingClientRect();
    let distance = touch.clientX - rect.left;
    if (distance < 0) {
      distance = 0;
    } else if (distance > rect.width) {
      distance = rect.width;
    }
    this.dist.set(distance);
    const hue = (distance * 360) / rect.width;
    this.hue.set(hue);
  }

  protected resetAll() {
    const defaultHue = this.hexToHue(DEFAULT_COLOR);
    this.hue.set(defaultHue);
    const w = this.container().nativeElement.getBoundingClientRect().width;
    this.dist.set((this.hue() * w) / 360);

    setThemeSourceColor(DEFAULT_COLOR); //'#769CDF'

    this.theme.set('light');
    setTheme(this.theme());

    this.contrast.set('normal');
    setContrast(this.contrast());
  }

  protected submit() {
    // effect cleanup will set it
    this.startColor = this.hueToHex(this.hue());
    this.beforeContrast = this.contrast();
    this.beforeTheme = this.theme();
    this.ref.close();
  }

  private hexToHue(hex: string) {
    hex = hex.replace(/^#/, '');
    const num = parseInt(hex, 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (max === min) {
      return 0;
    }
    let h: number;
    const d = max - min;
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
    return h * 360;
  }

  private hueToHex(hue: number) {
    hue = hue % 360;
    if (hue < 0) {
      hue += 360;
    }
    const x = 1 - Math.abs(((hue / 60) % 2) - 1);
    let r: number;
    let g: number;
    let b: number;
    if (0 <= hue && hue < 60) {
      r = 1;
      g = x;
      b = 0;
    } else if (60 <= hue && hue < 120) {
      r = x;
      g = 1;
      b = 0;
    } else if (120 <= hue && hue < 180) {
      r = 0;
      g = 1;
      b = x;
    } else if (180 <= hue && hue < 240) {
      r = 0;
      g = x;
      b = 1;
    } else if (240 <= hue && hue < 300) {
      r = x;
      g = 0;
      b = 1;
    } else if (300 <= hue && hue < 360) {
      r = 1;
      g = 0;
      b = x;
    }
    r = Math.round(r * 255);
    g = Math.round(g * 255);
    b = Math.round(b * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
