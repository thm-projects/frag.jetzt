import { ComposeHostDirective } from '../../../../../../../../projects/ars/src/lib/compose/compose-host.directive';
import { TranslateService } from '@ngx-translate/core';
import { InjectionToken } from '@angular/core';
import { ArsObserver } from '../../../../../../../../projects/ars/src/lib/models/util/ArsObserver';

export interface QuestionWallMenuDropDownConfig {
  translate:TranslateService;
  title:string;
  compose:(e:ComposeHostDirective)=>void;
  condition?:()=>boolean;
  expanded:ArsObserver<boolean>
}
export const QUESTION_WALL_MENU_DROP_DOWN_CONFIG=new InjectionToken('QUESTION_WALL_MENU_DROP_DOWN_CONFIG');


