import { TranslateService } from '@ngx-translate/core';
import { InjectionToken } from '@angular/core';
import { ArsObserver } from '../../../models/util/ars-observer';

export interface ArsMatToggleConfig{
  translate: TranslateService;
  textActivated: string;
  textDeactivated: string;
  colorActivated?: string;
  colorDeactivated?: string;
  callback?: (e?: MouseEvent) => void;
  condition?: () => boolean;
  checked: ArsObserver<boolean>;
  checkAsToggle?: boolean;
  height?: number;
}

export const ARS_MAT_TOGGLE_CONFIG = new InjectionToken('ARS_MAT_TOGGLE_DATA');
