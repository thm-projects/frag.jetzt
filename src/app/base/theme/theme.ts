import { computed, signal } from '@angular/core';
import { dataService } from '../db/data-service';

export const AVAILABLE_THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof AVAILABLE_THEMES)[number];

const observer = matchMedia('(prefers-color-scheme: dark)');
const darkSignal = signal<boolean>(observer.matches);
observer.addEventListener('change', () => darkSignal.set(observer.matches));
export const isDark = darkSignal.asReadonly();

const themeSignal = signal<Theme>('system');
export const theme = themeSignal.asReadonly();
export const setTheme = (theme: Theme): boolean => {
  if (!AVAILABLE_THEMES.includes(theme)) {
    console.error('Tried to set "' + theme + '" as Theme!');
    return false;
  }
  themeSignal.set(theme);
  return true;
};
export const actualTheme = computed(() => {
  const currentTheme = theme();
  if (currentTheme !== 'system') {
    return currentTheme;
  }
  return isDark() ? 'dark' : 'light';
});

// side effect
dataService.config.get('theme').subscribe((theme) => {
  setTheme(theme?.value as Theme);
});
