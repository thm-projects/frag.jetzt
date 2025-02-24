import { computed, signal } from '@angular/core';
import { dataService } from '../db/data-service';

export const AVAILABLE_CONTRASTS = [
  'low',
  'normal',
  'medium',
  'high',
  'system',
] as const;
export type Contrast = (typeof AVAILABLE_CONTRASTS)[number];

const observer = matchMedia('(prefers-contrast: more)');
const highContrastSignal = signal<boolean>(observer.matches);
observer.addEventListener('change', () =>
  highContrastSignal.set(observer.matches),
);
export const isHighContrast = highContrastSignal.asReadonly();

const contrastSignal = signal<Contrast>('normal');
export const contrast = contrastSignal.asReadonly();
export const setContrast = (contrast: Contrast): boolean => {
  if (!AVAILABLE_CONTRASTS.includes(contrast)) {
    console.error('Tried to set "' + contrast + '" as Contrast!');
    return false;
  }
  contrastSignal.set(contrast);
  dataService.config
    .createOrUpdate({
      key: 'contrast',
      value: contrast,
    })
    .subscribe();
  return true;
};
export const actualContrast = computed(() => {
  const currentContrast = contrast();
  if (currentContrast !== 'system') {
    return currentContrast;
  }
  return isHighContrast() ? 'high' : 'normal';
});

// side effect
dataService.config.get('contrast').subscribe((contrast) => {
  setContrast(contrast?.value as Contrast);
});
