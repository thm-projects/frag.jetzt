import { TranslateService } from '@ngx-translate/core';
import { InjectionToken } from '@angular/core';

export interface ArsMatMenuItemConfig{
  translate: TranslateService;
  icon: string;
  class: string;
  isSVGIcon?: boolean;
  text: string;
  color?: string;
  iconColor?: string;
  callback?: (e?: MouseEvent) => void;
  condition?: () => boolean;
  routerLink?: string;
}

export const ARS_MAT_MENU_ITEM_DATA = new InjectionToken('ARS_MAT_MENU_ITEM_DATA');
