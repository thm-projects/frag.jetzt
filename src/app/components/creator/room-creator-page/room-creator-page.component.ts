import { AfterContentInit, AfterViewInit, Component, ComponentRef, EventEmitter, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Room } from '../../../models/room';
import { CommentSettingsDialog } from '../../../models/comment-settings-dialog';
import { Location } from '@angular/common';
import { NotificationService } from '../../../services/util/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { RoomEditComponent } from '../_dialogs/room-edit/room-edit.component';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { CommentService } from '../../../services/http/comment.service';
import { ModeratorsComponent } from '../_dialogs/moderators/moderators.component';
import { BonusTokenComponent } from '../_dialogs/bonus-token/bonus-token.component';
import { CommentSettingsComponent } from '../_dialogs/comment-settings/comment-settings.component';
import { TagsComponent } from '../_dialogs/tags/tags.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { TitleService } from '../../../services/util/title.service';
import { DeleteCommentsComponent } from '../_dialogs/delete-comments/delete-comments.component';
import { Export } from '../../../models/export';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { TopicCloudFilterComponent } from '../../shared/_dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { RoomDeleteComponent } from '../_dialogs/room-delete/room-delete.component';
import { RoomDeleted } from '../../../models/events/room-deleted';
import { ProfanitySettingsComponent } from '../_dialogs/profanity-settings/profanity-settings.component';
import { RoomDescriptionSettingsComponent } from '../_dialogs/room-description-settings/room-description-settings.component';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { User } from '../../../models/user';
import { HeaderService } from '../../../services/util/header.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { UserRole } from '../../../models/user-roles.enum';
import { Palette } from '../../../../theme/Theme';
import { ArsObserver } from '../../../../../projects/ars/src/lib/models/util/ars-observer';

@Component({
  selector:'app-room-creator-page',
  templateUrl:'./room-creator-page.component.html',
  styleUrls:['./room-creator-page.component.scss']
})
export class RoomCreatorPageComponent extends RoomPageComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit{
  room: Room;
  user: User;
  encodedShortId: string;
  updRoom: Room;
  commentThreshold: number;
  updCommentThreshold: number;
  deviceType = localStorage.getItem('deviceType');
  viewModuleCount = 1;
  moderatorCommentCounter: number;
  commentCounterEmitSubscription: any;
  urlToCopy = `${window.location.protocol}//${window.location.hostname}/participant/room/`;
  headerInterface = null;
  onDestroyListener: EventEmitter<void> = new EventEmitter<void>();

  constructor(protected roomService: RoomService,
              protected notification: NotificationService,
              protected route: ActivatedRoute,
              protected location: Location,
              public dialog: MatDialog,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentService,
              protected commentService: CommentService,
              private liveAnnouncer: LiveAnnouncer,
              private _r: Renderer2,
              public eventService: EventService,
              public titleService: TitleService,
              private notificationService: NotificationService,
              private bonusTokenService: BonusTokenService,
              public router: Router,
              public translationService: TranslateService,
              public authenticationService: AuthenticationService,
              public headerService: HeaderService,
              public composeService: ArsComposeService){
    super(roomService, route, location, wsCommentService, commentService, eventService);
    this.commentCounterEmitSubscription = this.commentCounterEmit.subscribe(e => {
      this.titleService.attachTitle('(' + e + ')');
    });
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngAfterViewInit(){
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
  }

  initNavigation(){
    const list: ComponentRef<any>[] = this.composeService.builder(this.headerService.getHost(), e => {
      e.menuItem({
        translate:this.headerService.getTranslate(),
        icon:'flag',
        text:'header.edit-session-description',
        callback:() => this.editSessionDescription(),
        condition:() => this.user.role > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.headerService.getTranslate(),
        icon:'visibility_off',
        isSVGIcon:false,
        text:'header.moderation-mode',
        callback:() => this.showCommentsDialog(),
        condition:() => this.user.role > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.headerService.getTranslate(),
        icon:'gavel',
        text:'header.edit-moderator',
        callback:() => this.showModeratorsDialog(),
        condition:() => this.user.role > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.headerService.getTranslate(),
        icon:'comment_tag',
        isSVGIcon:true,
        text:'header.edit-tags',
        callback:() => this.showTagsDialog(),
        condition:() => this.user.role > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.headerService.getTranslate(),
        icon:'grade',
        iconColor:Palette.YELLOW,
        text:'header.bonustoken',
        callback:() => this.showBonusTokenDialog(),
        condition:() => this.user.role >= UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.headerService.getTranslate(),
        icon:'file_download',
        text:'header.export-questions',
        callback:() => this.exportQuestions(),
        condition:() => this.user.role >= UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.headerService.getTranslate(),
        icon:'clear',
        text:'header.profanity-filter',
        callback:() => this.toggleProfanityFilter(),
        condition:() => this.user.role > UserRole.PARTICIPANT
      });
      e.menuItem({
        translate:this.headerService.getTranslate(),
        icon:'delete_sweep',
        iconColor:Palette.RED,
        text:'header.delete-questions',
        callback:() => this.openDeleteRoomDialog(),
        condition:() => this.user.role === UserRole.CREATOR
      });
      e.menuItem({
        translate:this.headerService.getTranslate(),
        icon:'delete',
        iconColor:Palette.RED,
        isSVGIcon:false,
        text:'header.delete-room',
        callback:() => this.openDeleteRoomDialog(),
        condition:() => this.user.role === UserRole.CREATOR
      });
      e.altToggle(
        {
          translate:this.headerService.getTranslate(),
          text:'header.unlock',
          icon:'block',
          iconColor:Palette.RED,
          color:Palette.RED
        },
        {
          translate:this.headerService.getTranslate(),
          text:'header.block',
          icon:'block',
          iconColor:Palette.RED
        },
        ArsObserver.build<boolean>(e => {
          e.set(this.room.questionsBlocked);
          e.onChange(a => {
            this.room.questionsBlocked = a.get();
            this.roomService.updateRoom(this.room).subscribe();
            if (a.get()){
              this.headerService.getTranslate().get('header.questions-blocked').subscribe(msg => {
                this.headerService.getNotificationService().show(msg);
              });
            }
          });
        })
        ,
        () => this.user.role > UserRole.PARTICIPANT
      );
    });
    this.onDestroyListener.subscribe(() => {
      list.forEach(e => e.destroy());
    });
  }

  navigateModeratorSettings(){
    this.showCommentsDialog();
  }

  toggleProfanityFilter(){
    const dialogRef = this.dialog.open(ProfanitySettingsComponent, {
      width:'400px'
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
      this.translateService,
      'comment-list',
      this.notificationService);
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
        this.translateService.get('room-page.comments-deleted').subscribe(msg => {
          this.notificationService.show(msg);
        });
        this.commentService.deleteCommentsByRoomId(this.room.id).subscribe();
      }
    });
  }

  ngOnDestroy(){
    super.ngOnDestroy();
    this.commentCounterEmitSubscription.unsubscribe();
    this.titleService.resetTitle();
    if (this.headerInterface){
      this.headerInterface.unsubscribe();
    }
    this.onDestroyListener.emit();
  }

  ngAfterContentInit(): void{
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 700);
  }

  ngOnInit(){
    window.scroll(0, 0);
    this.translateService.use(localStorage.getItem('currentLang'));
    this.route.params.subscribe(params => {
      this.initializeRoom(params['shortId']);
      this.encodedShortId = params['shortId'];
    });
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      const lang: string = this.translateService.currentLang;
      if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true && this.eventService.focusOnInput === false){
        document.getElementById('question_answer-button').focus();
      }else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true && this.eventService.focusOnInput === false){
        document.getElementById('gavel-button').focus();
      }else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit4) === true && this.eventService.focusOnInput === false){
        document.getElementById('settings-menu').focus();
      }else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true && this.eventService.focusOnInput === false){
        this.liveAnnouncer.clear();
        if (lang === 'de'){
          this.liveAnnouncer.announce('Aktueller Sitzungs-Name: ' + this.room.name + '. ' +
            'Aktueller Raum-Code: ' + this.room.shortId);
        }else{
          this.liveAnnouncer.announce('Current Session-Name: ' + this.room.name + '. ' +
            'Current Session Code: ' + this.room.shortId);
        }
      }else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit9, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === false
      ){
        this.announce();
      }else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true && this.eventService.focusOnInput === true){
        this.eventService.makeFocusOnInputFalse();
      }
    });
  }

  public announce(){
    const lang: string = this.translateService.currentLang;
    this.liveAnnouncer.clear();
    if (lang === 'de'){
      this.liveAnnouncer.announce('Du befindest dich in der von dir erstellten Sitzung. ' +
        'Drücke die Taste 1 um auf die Fragen-Übersicht zu gelangen, ' +
        'die Taste 2 um das Sitzungs-Menü zu öffnen, die Taste 3 um in die Moderationsübersicht zu gelangen, ' +
        'die Taste 4 um Einstellungen an der Sitzung vorzunehmen, ' +
        'die Taste 8 um den aktuellen Raum-Code zu hören, die Taste 0 um auf den Zurück-Button zu gelangen, ' +
        'oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
    }else{
      this.liveAnnouncer.announce('You are in the session you created. ' +
        'Press key 1 to go to the question overview, ' +
        'Press key 2 to open the session menu, key 3 to go to the moderation overview, ' +
        'Press key 4 to go to the session settings, ' +
        'Press the 8 for he current room code,  0 to go back, ' +
        'or press 9 to repeat this announcement.', 'assertive');
    }
  }

  postRoomLoadHook(){
    if (this.moderationEnabled){
      this.viewModuleCount = this.viewModuleCount + 1;
      this.commentService.countByRoomId(this.room.id, false).subscribe(commentCounter => {
        this.moderatorCommentCounter = commentCounter;
      });
    }

  }

  updateCommentSettings(settings: CommentSettingsDialog){
    this.room.tags = settings.tags;

    if (this.moderationEnabled && !settings.enableModeration){
      this.viewModuleCount = this.viewModuleCount - 1;
    }else if (!this.moderationEnabled && settings.enableModeration){
      this.viewModuleCount = this.viewModuleCount + 1;
    }

    this.moderationEnabled = settings.enableModeration;
    localStorage.setItem('moderationEnabled', String(this.moderationEnabled));
  }

  resetThreshold(): void{
    this.room.moderated = undefined;
    this.room.threshold = undefined;
    this.room.directSend = undefined;
    this.room.tags = undefined;
  }

  saveChanges(){
    this.roomService.updateRoom(this.updRoom)
    .subscribe((room) => {
        this.room = room;
        this.translateService.get('room-page.changes-successful').subscribe(msg => {
          this.notification.show(msg);
        });
      },
      error => {
        this.translateService.get('room-page.changes-gone-wrong').subscribe(msg => {
          this.notification.show(msg);
        });
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
          this.updateCommentSettings(result);
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
    this.translationService.get('room-page.deleted').subscribe(msg => {
      this.notificationService.show(this.room.name + msg);
    });
    this.roomService.deleteRoom(this.room.id).subscribe(result => {
      const event = new RoomDeleted(this.room.id);
      this.eventService.broadcast(event.type, event.payload);
      this.location.back();
    });
  }

  copyShortId(): void{
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = `${this.urlToCopy}${this.encodedShortId}`;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.translateService.get('room-page.session-id-copied').subscribe(msg => {
      this.notification.show(msg, '', {duration:2000});
    });
  }
}

