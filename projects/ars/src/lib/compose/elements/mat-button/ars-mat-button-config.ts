import { TranslateService } from '@ngx-translate/core';
import { InjectionToken } from '@angular/core';


export interface ArsMatButtonConfig{
  translate: TranslateService;
  title: string;
  icon?: string;
  isSVGIcon?: boolean;
  callback?: (e?: MouseEvent) => void;
  condition?: () => boolean;
}

export const ARS_MAT_BUTTON_CONFIG = new InjectionToken('ARS_MAT_TOGGLE_DATA');
