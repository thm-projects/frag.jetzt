import { signal } from '@angular/core';
import {
  M3FabEntry,
  M3HeaderTemplate,
  M3NavigationTemplate,
  M3PreferredTemplate,
} from './m3-navigation.types';

export const PREFERRED_NAVIGATION = signal<M3PreferredTemplate>({
  railOrientation: 'start',
  railDivider: false,
});
export const NAVIGATION = signal<M3NavigationTemplate | null>(null);
export const FAB_BUTTON = signal<M3FabEntry | null>(null);
export const HEADER = signal<M3HeaderTemplate | null>(null);
