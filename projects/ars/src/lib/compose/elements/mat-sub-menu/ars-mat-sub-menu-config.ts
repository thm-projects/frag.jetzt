import { TranslateService } from '@ngx-translate/core';
import { InjectionToken } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

export interface ArsMatSubMenuConfig {
  translate: TranslateService;
  icon: string;
  class: string;
  menu: MatMenu;
  isSVGIcon?: boolean;
  text: string;
  color?: string;
  iconColor?: string;
  condition?: () => boolean;
  menuOpened?: () => void;
}

export const ARS_MAT_SUB_MENU_DATA = new InjectionToken(
  'ARS_MAT_SUB_MENU_DATA',
);
