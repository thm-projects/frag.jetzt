import { computed, effect, signal } from '@angular/core';
import {
  argbFromHex,
  DynamicColor,
  DynamicScheme,
  hexFromArgb,
  MaterialDynamicColors,
  themeFromSourceColor,
} from '@material/material-color-utilities';
import { getInjector } from '../angular-init';
import { actualTheme } from './theme';
import { actualContrast } from './contrast';
import { CUSTOM_COLORS } from './custom-colors';
import { dataService } from '../db/data-service';

const themeSourceColorSignal = signal('#769CDF');
export const themeSourceColor = themeSourceColorSignal.asReadonly();
export const setThemeSourceColor = (color: string): boolean => {
  try {
    argbFromHex(color);
  } catch {
    console.error('Tried to set "' + color + '" as Theme Source Color!');
    return false;
  }
  themeSourceColorSignal.set(color);
  dataService.config
    .createOrUpdate({
      key: 'theme-source-color',
      value: color,
    })
    .subscribe();
  return true;
};

const contrastLevel = computed(() => {
  switch (actualContrast()) {
    case 'low':
      return -1;
    case 'medium':
      return 0.5;
    case 'high':
      return 1;
    default:
      return 0;
  }
});

const getColors = () => {
  return Object.values(MaterialDynamicColors).filter(
    (e) => e instanceof DynamicColor && e.name && !e.name.includes('palette'),
  ) as DynamicColor[];
};

const COLORS = getColors();

// side effects
dataService.config.get('theme-source-color').subscribe((color) => {
  setThemeSourceColor(color?.value as string);
});

getInjector().subscribe((injector) => {
  effect(
    () => {
      const color = argbFromHex(themeSourceColor());
      const colorPalette = themeFromSourceColor(color, CUSTOM_COLORS);
      const isDark = actualTheme() === 'dark';
      const scheme = new DynamicScheme({
        sourceColorArgb: color,
        variant: 1,
        contrastLevel: contrastLevel(),
        isDark,
        neutralPalette: colorPalette.palettes.neutral,
        neutralVariantPalette: colorPalette.palettes.neutralVariant,
        primaryPalette: colorPalette.palettes.primary,
        secondaryPalette: colorPalette.palettes.secondary,
        tertiaryPalette: colorPalette.palettes.tertiary,
      });
      for (const color of COLORS) {
        document.documentElement.style.setProperty(
          `--mat-sys-${color.name.replaceAll('_', '-')}`,
          hexFromArgb(scheme.getArgb(color)),
        );
      }
      const label = isDark ? 'dark' : 'light';
      for (const color of colorPalette.customColors) {
        const name = color.color.name.replaceAll('_', '-');
        document.documentElement.style.setProperty(
          `--mat-sys-${name}`,
          hexFromArgb(color[label].color),
        );
        document.documentElement.style.setProperty(
          `--mat-sys-on-${name}`,
          hexFromArgb(color[label].onColor),
        );
        document.documentElement.style.setProperty(
          `--mat-sys-${name}-container`,
          hexFromArgb(color[label].colorContainer),
        );
        document.documentElement.style.setProperty(
          `--mat-sys-on-${name}-container`,
          hexFromArgb(color[label].onColorContainer),
        );
      }
    },
    { injector },
  );
});
