import { TranslateService } from '@ngx-translate/core';
import { InjectionToken, ViewContainerRef } from '@angular/core';

export interface ArsMatMenuItemConfig{
  translate:TranslateService;
  icon:string;
  text:string;
  color:string;
  callback:()=>void;
}

export const ARS_MAT_MENU_ITEM_DATA=new InjectionToken('ARS_MAT_MENU_ITEM_DATA');
