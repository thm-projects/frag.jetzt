import { CommentSettingsComponent } from '../../../creator/_dialogs/comment-settings/comment-settings.component';
import { CommentSettingsDialog } from '../../../../models/comment-settings-dialog';
import { ModeratorsComponent } from '../../../creator/_dialogs/moderators/moderators.component';
import { BonusTokenComponent } from '../../../creator/_dialogs/bonus-token/bonus-token.component';
import { TopicCloudFilterComponent } from '../../_dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { TagsComponent } from '../../../creator/_dialogs/tags/tags.component';
import { RoomDeleteComponent } from '../../../creator/_dialogs/room-delete/room-delete.component';
import { RoomDeleted } from '../../../../models/events/room-deleted';
import { Room } from '../../../../models/room';
import { User } from '../../../../models/user';
import { MatDialog } from '@angular/material/dialog';
import { ProfanitySettingsComponent } from '../../../creator/_dialogs/profanity-settings/profanity-settings.component';
import { RoomNameSettingsComponent } from '../../../creator/_dialogs/room-name-settings/room-name-settings.component';
import { RoomDescriptionSettingsComponent } from '../../../creator/_dialogs/room-description-settings/room-description-settings.component';
import { Export } from '../../../../models/export';
import { DeleteCommentsComponent } from '../../../creator/_dialogs/delete-comments/delete-comments.component';
import { RoomEditComponent } from '../../../creator/_dialogs/room-edit/room-edit.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { RoomService } from '../../../../services/http/room.service';
import { EventService } from '../../../../services/util/event.service';
import { Location } from '@angular/common';
import { CommentService } from '../../../../services/http/comment.service';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { RoomPageHeader } from '../room-page-header/room-page-header';
import { ArsComposeService } from '../../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../../services/util/header.service';
import { EventEmitter } from '@angular/core';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';

export interface RoomPageEditConfig{

  updateCommentSettings(settings: CommentSettingsDialog): void;

  onDestroyListener: EventEmitter<void>;
  onAfterViewInitListener: EventEmitter<void>;
  onInitListener: EventEmitter<void>;

}

export class RoomPageEdit{

  private updRoom: Room;
  private room: Room;
  private user: User;
  private encodedShortId: string;

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private notification: NotificationService,
    private roomService: RoomService,
    private eventService: EventService,
    private location: Location,
    private commentService: CommentService,
    private bonusTokenService: BonusTokenService,
    private headerService: HeaderService,
    private composeService: ArsComposeService,
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private config: RoomPageEditConfig
  ){
    config.onInitListener.subscribe(() => {
      this.route.params.subscribe(params => {
        this.encodedShortId = params['shortId'];
      });
    });
    config.onAfterViewInitListener.subscribe(() => {
      let isBuild = false;
      this.authenticationService.watchUser.subscribe(user => {
        this.user = user;
        this.roomService.getRoomByShortId(this.encodedShortId).subscribe(e => {
          this.room = e;
          if (isBuild){
            return;
          }
          this.initNavigation();
          isBuild = true;
        });
      });
    });
  }

  initNavigation(){
    // This could be simplified by the component implementing the interface and passing it instead
    // esp. with a visitor pattern
    new RoomPageHeader(
      {
        onDeleteRoom:() => this.deleteRoom(),
        onDeleteQuestions:() => this.deleteQuestions(),
        onToggleProfanity:() => this.toggleProfanityFilter(),
        onExportQuestions:() => this.exportQuestions(),
        onShowTags:() => this.showTagsDialog(),
        onShowComments:() => this.showCommentsDialog(),
        onEditSessionDescription:() => this.editSessionDescription(),
        onShowBonusToken:() => this.showBonusTokenDialog(),
        onShowModerators:() => this.showModeratorsDialog()
      }, {
        onDestroy:this.config.onDestroyListener,
        room:() => this.room,
        user:() => this.user,
        headerService:this.headerService,
        composeService:this.composeService,
        roomService:this.roomService
      }
    ).build();
  }

  //Dialogs

  showCommentsDialog(): void{
    this.updRoom = JSON.parse(JSON.stringify(this.room));

    const dialogRef = this.dialog.open(CommentSettingsComponent, {
      width:'400px'
    });
    dialogRef.componentInstance.roomId = this.room.id;
    dialogRef.componentInstance.editRoom = this.updRoom;
    dialogRef.afterClosed()
    .subscribe(result => {
      if (result === 'abort'){
        return;
      }else{
        if (result instanceof CommentSettingsDialog){
          this.config.updateCommentSettings(result);
          this.saveChanges();
        }
      }
    });
    dialogRef.backdropClick().subscribe(res => {
      dialogRef.close('abort');
    });
  }

  showModeratorsDialog(): void{
    const dialogRef = this.dialog.open(ModeratorsComponent, {
      width:'400px'
    });
    dialogRef.componentInstance.roomId = this.room.id;
  }

  showBonusTokenDialog(): void{
    const dialogRef = this.dialog.open(BonusTokenComponent, {
      width:'400px'
    });
    dialogRef.componentInstance.room = this.room;
  }

  showTagCloud(): void{
    const dialogRef = this.dialog.open(TopicCloudFilterComponent, {
      width:'400px'
    });
  }

  showTagsDialog(): void{
    this.updRoom = JSON.parse(JSON.stringify(this.room));
    const dialogRef = this.dialog.open(TagsComponent, {
      width:'400px'
    });
    let tags = [];
    if (this.room.tags !== undefined){
      tags = this.room.tags;
    }
    dialogRef.componentInstance.tags = tags;
    dialogRef.afterClosed()
    .subscribe(result => {
      if (!result || result === 'abort'){
        return;
      }else{
        this.updRoom.tags = result;
        this.saveChanges();
      }
    });
  }

  openDeleteRoomDialog(): void{
    const dialogRef = this.dialog.open(RoomDeleteComponent, {
      width:'400px'
    });
    dialogRef.componentInstance.room = this.room;
    dialogRef.afterClosed()
    .subscribe(result => {
      if (result === 'delete'){
        this.deleteRoom();
      }
    });
  }

  deleteRoom(): void{
    this.translate.get('room-page.deleted').subscribe(msg => {
      this.notification.show(this.room.name + msg);
    });
    this.roomService.deleteRoom(this.room.id).subscribe(result => {
      const event = new RoomDeleted(this.room.id);
      this.eventService.broadcast(event.type, event.payload);
      this.location.back();
    });
  }


  toggleProfanityFilter(){
    const dialogRef = this.dialog.open(ProfanitySettingsComponent, {
      width:'400px'
    });
    dialogRef.componentInstance.editRoom = this.room;
  }

  editSessionName(){
    const dialogRef = this.dialog.open(RoomNameSettingsComponent, {
      width:'900px',
      maxWidth:'calc( 100% - 50px )',
      maxHeight:'calc( 100vh - 50px )',
      autoFocus:false
    });
    dialogRef.componentInstance.editRoom = this.room;
  }

  editSessionDescription(){
    const dialogRef = this.dialog.open(RoomDescriptionSettingsComponent, {
      width:'900px',
      maxWidth:'calc( 100% - 50px )',
      maxHeight:'calc( 100vh - 50px )',
      autoFocus:false
    });
    dialogRef.componentInstance.editRoom = this.room;
  }

  exportQuestions(){
    const exp: Export = new Export(
      this.room,
      this.commentService,
      this.bonusTokenService,
      this.translate,
      'comment-list',
      this.notification);
    exp.exportAsCsv();
  }

  deleteQuestions(){
    const dialogRef = this.dialog.open(DeleteCommentsComponent, {
      width:'400px'
    });
    dialogRef.componentInstance.roomId = this.room.id;
    dialogRef.afterClosed()
    .subscribe(result => {
      if (result === 'delete'){
        this.translate.get('room-page.comments-deleted').subscribe(msg => {
          this.notification.show(msg);
        });
        this.commentService.deleteCommentsByRoomId(this.room.id).subscribe();
      }
    });
  }

  showSettingsDialog(): void{
    this.updRoom = JSON.parse(JSON.stringify(this.room));
    const dialogRef = this.dialog.open(RoomEditComponent, {
      width:'400px'
    });
    dialogRef.componentInstance.editRoom = this.updRoom;
    dialogRef.afterClosed()
    .subscribe(result => {
      if (result === 'abort'){
        return;
      }else if (result !== 'delete'){
        this.saveChanges();
      }
    });
    dialogRef.backdropClick().subscribe(res => {
      dialogRef.close('abort');
    });
  }

  // tools

  saveChanges(){
    this.roomService.updateRoom(this.updRoom)
    .subscribe((room) => {
        this.room = room;
        this.translate.get('room-page.changes-successful').subscribe(msg => {
          this.notification.show(msg);
        });
      },
      error => {
        this.translate.get('room-page.changes-gone-wrong').subscribe(msg => {
          this.notification.show(msg);
        });
      });
  }

}
