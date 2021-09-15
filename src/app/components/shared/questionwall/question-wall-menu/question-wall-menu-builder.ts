import { QuestionWallComponent } from '../question-wall/question-wall.component';
import { QuestionWallMenuComponent } from './question-wall-menu.component';
import { ComposeHostDirective } from '../../../../../../projects/ars/src/lib/compose/compose-host.directive';
import { ComposeService } from '../../../../../../projects/ars/src/lib/service/compose.service';
import { QUESTION_WALL_OPTION_CONFIG, QuestionWallOptionConfig } from './build/question-wall-option/question-wall-option-config';
import { QuestionWallOptionComponent } from './build/question-wall-option/question-wall-option.component';
import { ComponentRef } from '@angular/core';
import {
  ARS_MAT_CHIP_LIST_CONFIG,
  ArsMatChipListConfig
} from '../../../../../../projects/ars/src/lib/compose/elements/mat-chip-list/mat-chip-list-config';
import { MatChipListComponent } from '../../../../../../projects/ars/src/lib/compose/elements/mat-chip-list/mat-chip-list.component';
import { ArsObserver } from '../../../../../../projects/ars/src/lib/models/util/ArsObserver';


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
    this.createOption({
      translate:this.questionwall.translateService,
      icon:"sort",
      title:"Sortieren",
      compose:e=>{
        this.createChips(e,{
          list:ArsObserver.build(obs=>{
            obs.set(['Neuste','Älteste','Bewertung']);
          }),
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
            this.questionwall.filterUserByNumber(parseInt(el));
          }
        });
      }
    });
  }

  private createOption(config:QuestionWallOptionConfig):ComponentRef<any>{
    return this.composeService.create(
      this.menu.host.viewContainerRef,
      QuestionWallOptionComponent,
      this.composeService.createMap(QUESTION_WALL_OPTION_CONFIG, config)
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

  destroy(){
    this.compose.viewContainerRef.clear();
    this.onDestroyListener.forEach(e=>e());
  }



}
