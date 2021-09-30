import { ComponentRef, EventEmitter } from '@angular/core';
import { UserRole } from '../../../../models/user-roles.enum';
import { Palette } from '../../../../../theme/Theme';
import { ArsObserver } from '../../../../../../projects/ars/src/lib/models/util/ars-observer';
import { HeaderService } from '../../../../services/util/header.service';
import { ArsComposeService } from '../../../../../../projects/ars/src/lib/services/ars-compose.service';
import { User } from '../../../../models/user';
import { Room } from '../../../../models/room';
import { RoomService } from '../../../../services/http/room.service';

export interface RoomPageHeaderAction{

  onEditSessionDescription: () => void;
  onShowComments: () => void;
  onShowModerators: () => void;
  onShowTags: () => void;
  onShowBonusToken: () => void;
  onExportQuestions: () => void;
  onToggleProfanity: () => void;
  onDeleteRoom: () => void;
  onDeleteQuestions: () => void;

}

export interface RoomPageHeaderConfig{

  onDestroy: EventEmitter<void>;

  user: () => User;
  room: () => Room;

  headerService: HeaderService;
  composeService: ArsComposeService;
  roomService: RoomService;

}

export class RoomPageHeader{

  constructor(
    private action: RoomPageHeaderAction,
    private config: RoomPageHeaderConfig
  ){
  }

  build(){
    const list: ComponentRef<any>[] = this.config.composeService.builder(this.config.headerService.getHost(), e => {
      e.menuItem({
        translate:this.config.headerService.getTranslate(),
        icon:'flag',
        text:'header.edit-session-description',
        callback:() => this.action.onEditSessionDescription(),
        condition:() => this.config.user().role > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.config.headerService.getTranslate(),
        icon:'visibility_off',
        isSVGIcon:false,
        text:'header.moderation-mode',
        callback:() => this.action.onShowComments(),
        condition:() => this.config.user().role > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.config.headerService.getTranslate(),
        icon:'gavel',
        text:'header.edit-moderator',
        callback:() => this.action.onShowModerators(),
        condition:() => this.config.user().role > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.config.headerService.getTranslate(),
        icon:'comment_tag',
        isSVGIcon:true,
        text:'header.edit-tags',
        callback:() => this.action.onShowTags(),
        condition:() => this.config.user().role > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.config.headerService.getTranslate(),
        icon:'grade',
        iconColor:Palette.YELLOW,
        text:'header.bonustoken',
        callback:() => this.action.onShowTags(),
        condition:() => this.config.user().role >= UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.config.headerService.getTranslate(),
        icon:'file_download',
        text:'header.export-questions',
        callback:() => this.action.onExportQuestions(),
        condition:() => this.config.user().role >= UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.config.headerService.getTranslate(),
        icon:'clear',
        text:'header.profanity-filter',
        callback:() => this.action.onToggleProfanity(),
        condition:() => this.config.user().role > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.config.headerService.getTranslate(),
        icon:'delete_sweep',
        iconColor:Palette.RED,
        text:'header.delete-questions',
        callback:() => this.action.onDeleteQuestions(),
        condition:() => this.config.user().role === UserRole.CREATOR
      });
      e.menuItem({
        translate:this.config.headerService.getTranslate(),
        icon:'delete',
        iconColor:Palette.RED,
        isSVGIcon:false,
        text:'header.delete-room',
        callback:() => this.action.onDeleteRoom(),
        condition:() => this.config.user().role === UserRole.CREATOR
      });
      e.altToggle(
        {
          translate:this.config.headerService.getTranslate(),
          text:'header.block',
          icon:'block',
          iconColor:Palette.RED
        },
        {
          translate:this.config.headerService.getTranslate(),
          text:'header.unlock',
          icon:'block',
          iconColor:Palette.RED,
          color:Palette.RED
        },
        ArsObserver.build<boolean>(e => {
          e.set(this.config.room().questionsBlocked);
          e.onChange(a => {
            this.config.room().questionsBlocked = a.get();
            this.config.roomService.updateRoom(this.config.room()).subscribe();
            if (a.get()){
              this.config.headerService.getTranslate().get('header.questions-blocked').subscribe(msg => {
                this.config.headerService.getNotificationService().show(msg);
              });
            }
            else {
              this.config.headerService.getTranslate().get('header.questions-unblocked').subscribe(msg => {
                this.config.headerService.getNotificationService().show(msg);
              });
            }
          });
        })
        ,
        () => this.config.user().role > UserRole.PARTICIPANT
      );
    });
    this.config.onDestroy.subscribe(() => {
      list.forEach(e => e.destroy());
    });
  }

}
