import { QuestionWallComponent } from '../question-wall/question-wall.component';
import { QuestionWallMenuComponent } from './question-wall-menu.component';
import { ComposeHostDirective } from '../../../../../../projects/ars/src/lib/compose/compose-host.directive';
import { ComposeService } from '../../../../../../projects/ars/src/lib/service/compose.service';
import { QUESTION_WALL_OPTION_CONFIG, QuestionWallOptionConfig } from './build/question-wall-option/question-wall-option-config';
import { QuestionWallOptionComponent } from './build/question-wall-option/question-wall-option.component';
import { ComponentRef } from '@angular/core';
import {
  ARS_MAT_CHIP_LIST_CONFIG,
  ArsMatChipConfig,
  ArsMatChipListConfig
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
import { Period } from '../../../../utils/filter-options';
import {
  ARS_MAT_BUTTON_CONFIG,
  ArsMatButtonConfig
} from '../../../../../../projects/ars/src/lib/compose/elements/mat-button/ars-mat-button-config';
import { MatButtonComponent } from '../../../../../../projects/ars/src/lib/compose/elements/mat-button/mat-button.component';
import { TagsComponent } from '../../../creator/_dialogs/tags/tags.component';


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
      icon:"sort",
      title:"Sortieren",
      compose:e=>{
        this.createChips(e,{
          list:ArsObserver.build(a=>{
            a.set([
              {
                title:"Neuste",
                onSelect:el=>{
                  this.questionwall.sortTime();
                }
              },
              {
                title:"Älteste",
                onSelect:el=>{
                  this.questionwall.sortTime(false);
                }
              },
              {
                title:"Bewertung",
                onSelect:el=>{
                  this.questionwall.sortScore();
                }
              },
            ]);
          })
        });
      }
    });
    this.createOption({
      translate:this.questionwall.translateService,
      icon:'access_time',
      title:'Zeitraum',
      compose:e => {
        this.createChips(e,{
          list:new ArsObserver<ArsMatChipConfig[]>([
            {
              title:'Fragen ab jetzt anzeigen',
              onSelect:select=>this.questionwall.setTimePeriod(Period.fromNow)
            },
            {
              title:'Letzte Stunde',
              onSelect:select=>this.questionwall.setTimePeriod(Period.oneHour)
            },
            {
              title:'Letzten 3 Stunden',
              onSelect:select=>this.questionwall.setTimePeriod(Period.threeHours)
            },
            {
              title:'Letzten 24 Stunden',
              onSelect:select=>this.questionwall.setTimePeriod(Period.oneDay)
            },
            {
              title:'Letzten 7 Tage',
              onSelect:select=>this.questionwall.setTimePeriod(Period.oneWeek)
            },
            {
              title:'Letzten 14 Tage',
              onSelect:select=>this.questionwall.setTimePeriod(Period.twoWeeks)
            },
            {
              title:'Zeitlich unbegrenzt',
              onSelect:select=>this.questionwall.setTimePeriod(Period.all)
            },
          ])
        });
        this.createDropDown(e,{
          translate:this.questionwall.translateService,
          expanded:ArsObserver.build(obs=>{
            obs.set(false);
          }),
          title:'Erweitert',
          compose:e1=>{
            this.createDatePicker(e1,{
              translate:this.questionwall.translateService,
              change:ArsObserver.build(obs=>{

              }),
              title:'Von',
              appearance:'fill',
              callback:date=>{

              }
            })
            this.createDatePicker(e1,{
              translate:this.questionwall.translateService,
              change:ArsObserver.build(obs=>{

              }),
              title:'Bis',
              appearance:'fill',
              callback:date=>{

              }
            })
          }
        })
      }
    });
    this.createOption({
      translate:this.questionwall.translateService,
      icon:'filter_list',
      title:'Filter',
      compose:e=>{
        this.createChips(e,{
          list:new ArsObserver<ArsMatChipConfig[]>([
            {
              title:'Vorgemerkt für einen Bonus',
              icon:'grade',
              onSelect:select=>{
                this.questionwall.filterA(select,x => x.comment.favorite);
              }
            },
            {
              title:'Markierte Fragen',
              icon:'bookmark',
              onSelect:select=>{
                this.questionwall.filterA(select,x => x.comment.favorite);
              }
            },
            {
              title:'Beantwortete Fragen',
              icon:'comment',
              onSelect:select=>{
                this.questionwall.filterA(select,x => x.comment.answer!==null);
              }
            },
            {
              title:'Unbeantwortete Fragen',
              icon:'comment',
              onSelect:select=>{
                this.questionwall.filterA(select,x => x.comment.answer===null);
              }
            },
            {
              title:'Meine Fragen',
              icon:'person_pin_circle',
              onSelect:select=>{
                this.questionwall.filterA(select,x => x.comment.creatorId===this.questionwall.user.id);
              }
            }
          ])
        })
      }
    });
    this.createOption({
      translate:this.questionwall.translateService,
      title:'Kategorie',
      icon:'comment_tag',
      isSVGIcon:true,
      compose:e=>{
        this.createChips(e,{
          list:this.questionwall.tagObserver.map<ArsMatChipConfig[]>(left => {
            return left.get().map(value => {
              return {
                title:value,
                onSelect:e1 => {
                  this.questionwall.filterTag(value);
                }
              }
            });
          },true)
        });
      },
      composeTitle:e=>{
        this.createButton(e,{
          translate:this.questionwall.translateService,
          title:'neue Kategorie',
          icon:'add_circle',
          callback:e1 => {
            this.demoTagEdit();
          }
        })
      }
    });
    this.createOption({
      translate:this.questionwall.translateService,
      icon:'face',
      title:'Test',
      compose:e=>{
        this.createButton(e,{
          translate:this.questionwall.translateService,
          title:'test',
          callback:()=>{
            alert('yeet');
          }
        })
      }
    })
  }

  private demoTagEdit(){
    let updRoom = JSON.parse(JSON.stringify(this.questionwall.room));
    const dialogRef = this.questionwall.dialog.open(TagsComponent, {
      width: '400px'
    });
    let tags = [];
    if (this.questionwall.room.tags !== undefined) {
      tags = this.questionwall.room.tags;
    }
    dialogRef.componentInstance.tags = tags;
    dialogRef.afterClosed()
    .subscribe(result => {
      if (!result || result === 'abort') {
        return;
      } else {
        updRoom.tags = result;
        this.questionwall.roomService.updateRoom(updRoom).subscribe(e=>{
          this.questionwall.tagObserver.set(e.tags);
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

  private createButton(host:ComposeHostDirective,config:ArsMatButtonConfig):ComponentRef<any>{
    if(!host)return null;
    return this.composeService.create(
      host.viewContainerRef,
      MatButtonComponent,
      this.composeService.createMap(ARS_MAT_BUTTON_CONFIG, config)
    );
  }

  destroy(){
    this.compose.viewContainerRef.clear();
    this.onDestroyListener.forEach(e=>e());
  }



}
