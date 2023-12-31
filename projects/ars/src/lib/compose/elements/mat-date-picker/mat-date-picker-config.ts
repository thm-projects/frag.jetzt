import { InjectionToken } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatLegacyFormFieldAppearance as MatFormFieldAppearance } from '@angular/material/legacy-form-field';
import { ArsObserver } from '../../../models/util/ars-observer';


export interface ArsMatDatePickerConfig{
  translate: TranslateService,
  appearance?: MatFormFieldAppearance,
  title: string,
  callback?: (e: Date) => void,
  change: ArsObserver<Date>
}


export const ARS_MAT_DATE_PICKER = new InjectionToken('ARS_MAT_DATE_PICKER');
