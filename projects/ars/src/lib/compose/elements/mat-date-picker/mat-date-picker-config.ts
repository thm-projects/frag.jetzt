import { InjectionToken } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ArsObserver } from '../../../models/util/ars-observer';
import { MatFormFieldAppearance } from '@angular/material/form-field';


export interface ArsMatDatePickerConfig{
  translate: TranslateService,
  appearance?: MatFormFieldAppearance,
  title: string,
  callback?: (e: Date) => void,
  change: ArsObserver<Date>
}


export const ARS_MAT_DATE_PICKER = new InjectionToken('ARS_MAT_DATE_PICKER');
