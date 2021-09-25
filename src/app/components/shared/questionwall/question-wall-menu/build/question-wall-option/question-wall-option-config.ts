import { TranslateService } from '@ngx-translate/core';
import { ComposeHostDirective } from '../../../../../../../../projects/ars/src/lib/compose/compose-host.directive';
import { InjectionToken } from '@angular/core';

export interface QuestionWallOptionConfig{

  translate:TranslateService;
  icon:string;
  isSVGIcon?:boolean;
  title:string;
  compose:(e:ComposeHostDirective)=>void;
  composeTitle?:(e:ComposeHostDirective)=>void;
  condition?:()=>boolean;

}

export const QUESTION_WALL_OPTION_CONFIG=new InjectionToken('QUESTION_WALL_OPTION_CONFIG');
