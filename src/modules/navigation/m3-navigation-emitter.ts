import { signal } from '@angular/core';
import { M3NavigationTemplate } from './m3-navigation.types';

export const NAVIGATION = signal<M3NavigationTemplate | null>(null);
