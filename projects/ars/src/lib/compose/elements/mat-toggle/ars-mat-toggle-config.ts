import { TranslateService } from '@ngx-translate/core';
import { InjectionToken } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';

export interface ArsMatToggleConfig {
  translate:TranslateService;
  textActivated:string;
  textDeactivated:string;
  callback?:(e:MatButtonToggleChange)=>void;
  condition?:()=>boolean;
}

export const ARS_MAT_TOGGLE_CONFIG=new InjectionToken('ARS_MAT_TOGGLE_DATA');
