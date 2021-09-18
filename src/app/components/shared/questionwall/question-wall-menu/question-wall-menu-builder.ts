import { QuestionWallComponent } from '../question-wall/question-wall.component';
import { QuestionWallMenuComponent } from './question-wall-menu.component';
import { ComposeHostDirective } from '../../../../../../projects/ars/src/lib/compose/compose-host.directive';
import { ComposeService } from '../../../../../../projects/ars/src/lib/service/compose.service';
import { QUESTION_WALL_OPTION_CONFIG, QuestionWallOptionConfig } from './build/question-wall-option/question-wall-option-config';
import { QuestionWallOptionComponent } from './build/question-wall-option/question-wall-option.component';
import { ComponentRef } from '@angular/core';
import {
  ARS_MAT_CHIP_LIST_CONFIG,
  ArsMatChipListConfig,
  ArsMatChipListType
} from '../../../../../../projects/ars/src/lib/compose/elements/mat-chip-list/mat-chip-list-config';
import { MatChipListComponent } from '../../../../../../projects/ars/src/lib/compose/elements/mat-chip-list/mat-chip-list.component';
import { ArsObserver } from '../../../../../../projects/ars/src/lib/models/util/ArsObserver';
import {
  ARS_MAT_DATE_PICKER,
  ArsMatDatePickerConfig
} from '../../../../../../projects/ars/src/lib/compose/elements/mat-date-picker/mat-date-picker-config';
import { MatDatePickerComponent } from '../../../../../../projects/ars/src/lib/compose/elements/mat-date-picker/mat-date-picker.component';
import {
  QUESTION_WALL_MENU_DROP_DOWN_CONFIG,
  QuestionWallMenuDropDownConfig
} from './build/question-wall-menu-drop-down/question-wall-menu-drop-down-config';
import { QuestionWallMenuDropDownComponent } from './build/question-wall-menu-drop-down/question-wall-menu-drop-down.component';


export class QuestionWallMenuBuilder {

  private compose:ComposeHostDirective
  private onDestroyListener=[];

  constructor(
    private questionwall:QuestionWallComponent,
    private menu:QuestionWallMenuComponent,
    private composeService:ComposeService
  ){
  }

  build(compose:ComposeHostDirective){
    this.compose=compose;
    /*
    this.createOption({
      translate:this.questionwall.translateService,
      icon:"sort",
      title:"Sortieren",
      compose:e=>{
        this.createChips(e,{
          type:ArsMatChipListType.TOGGLE,
          list:ArsObserver.build(obs=>{
            obs.set(['Neuste','Älteste','Bewertung']);
          }),
          def:['Neuste'],
          onSelect:el=>{
          }
        });
      }
    });
    this.createOption({
      translate:this.questionwall.translateService,
      icon:"access_time",
      title:"Zeitraum",
      compose:e=>{
        this.createChips(e,{
          list:ArsObserver.build(obs=>{
            obs.set(['Fragen ab jetzt anzeigen','Letzte 1 Stunde','Zeitlich Unbegrenzt']);
          }),
          onSelect:el=>{
          }
        });
        this.createDropDown(e,{
          translate:this.questionwall.translateService,
          expanded:ArsObserver.build(obs=>{
            obs.set(false);
          }),
          title:'ADVANCED',
          compose:e2=>{
            this.createDatePicker(e2,{
              translate:this.questionwall.translateService,
              title:'START',
              change:ArsObserver.build(obs=>{

              })
            });
            this.createDatePicker(e2,{
              translate:this.questionwall.translateService,
              title:'END',
              change:ArsObserver.build(obs=>{

              })
            });
          }
        });
      }
    });
    this.createOption({
      translate:this.questionwall.translateService,
      icon:"filter",
      title:"filter",
      compose:e=>{
        this.createChips(e,{
          list:ArsObserver.build(obs=>{
            obs.set(['Lesezeichen','vorgemerkt']);
          }),
          onSelect:el=>{
          }
        });
      }
    });
    this.createOption({
      translate:this.questionwall.translateService,
      icon:"comment_tag",
      isSVGIcon:true,
      title:"Kategorie",
      compose:e=>{
        this.createChips(e,{
          list:this.menu.questionwall.tagObserver,
          onSelect:el=>{
          }
        });
      }
    });
    this.createOption({
      translate:this.questionwall.translateService,
      icon:"person",
      title:"user",
      compose:e=>{
        this.createChips(e,{
          list:this.menu.questionwall.userListObserver,
          onSelect:el=>{
          }
        });
      }
    });
     */
    this.createOption({
      translate:this.questionwall.translateService,
      icon:"person",
      title:"user",
      compose:e=>{
        this.createChips(e,{
          list:ArsObserver.build(a=>{
            a.set([
              {
                title:"Neuste",
                onSelect:el=>{
                  console.log('sort by time');
                }
              },
              {
                title:"Älteste",
                onSelect:el=>{
                  console.log('sort by time');
                }
              },
              {
                title:"Bewertung",
                onSelect:el=>{
                  console.log('sort by time');
                }
              },
            ]);
          }),
          onSelect:s=>{
          }
        });
      }
    })
  }

  private createOption(config:QuestionWallOptionConfig):ComponentRef<any>{
    return this.composeService.create(
      this.menu.host.viewContainerRef,
      QuestionWallOptionComponent,
      this.composeService.createMap(QUESTION_WALL_OPTION_CONFIG, config)
    );
  }

  private createDropDown(host:ComposeHostDirective,config:QuestionWallMenuDropDownConfig):ComponentRef<any>{
    if(!host)return null;
    return this.composeService.create(
      host.viewContainerRef,
      QuestionWallMenuDropDownComponent,
      this.composeService.createMap(QUESTION_WALL_MENU_DROP_DOWN_CONFIG, config)
    );
  }

  private createChips(host:ComposeHostDirective,config:ArsMatChipListConfig):ComponentRef<any>{
    //add destroy listener
    return this.composeService.create(
      host.viewContainerRef,
      MatChipListComponent,
      this.composeService.createMap(ARS_MAT_CHIP_LIST_CONFIG, config)
    );
  }

  private createDatePicker(host:ComposeHostDirective,config:ArsMatDatePickerConfig):ComponentRef<any>{
    if(!host)return null;
    return this.composeService.create(
      host.viewContainerRef,
      MatDatePickerComponent,
      this.composeService.createMap(ARS_MAT_DATE_PICKER, config)
    );
  }

  destroy(){
    this.compose.viewContainerRef.clear();
    this.onDestroyListener.forEach(e=>e());
  }



}
