import { AfterContentInit, AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Room } from '../../../models/room';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Location } from '@angular/common';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { CommentService } from '../../../services/http/comment.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { CommentSettingsDialog } from '../../../models/comment-settings-dialog';
import { RoomPageEdit } from '../../shared/room-page/room-page-edit/room-page-edit';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../services/util/notification.service';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { HeaderService } from '../../../services/util/header.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';

@Component({
  selector:'app-room-participant-page',
  templateUrl:'./room-participant-page.component.html',
  styleUrls:['./room-participant-page.component.scss']
})
export class RoomParticipantPageComponent extends RoomPageComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit{

  room: Room;
  isLoading = true;
  deviceType = localStorage.getItem('deviceType');
  user: User;
  viewModuleCount = 1;
  roomPageEdit: RoomPageEdit;
  onDestroyListener: EventEmitter<void> = new EventEmitter<void>();
  onAfterViewInitListener: EventEmitter<void> = new EventEmitter<void>();
  onInitListener: EventEmitter<void> = new EventEmitter<void>();

  constructor(protected location: Location,
              protected roomService: RoomService,
              protected route: ActivatedRoute,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentService,
              protected commentService: CommentService,
              protected authenticationService: AuthenticationService,
              private liveAnnouncer: LiveAnnouncer,
              private _r: Renderer2,
              public eventService: EventService,
              public dialog: MatDialog,
              public notification: NotificationService,
              public bonusTokenService: BonusTokenService,
              public headerService: HeaderService,
              public composeService: ArsComposeService){
    super(roomService, route, location, wsCommentService, commentService, eventService);
    langService.langEmitter.subscribe(lang => translateService.use(lang));
    this.roomPageEdit = new RoomPageEdit(
      dialog,
      translateService,
      notification,
      roomService,
      eventService,
      location,
      commentService,
      bonusTokenService,
      headerService,
      composeService,
      authenticationService,
      route,
      {
        onInitListener:this.onInitListener,
        onAfterViewInitListener:this.onAfterViewInitListener,
        onDestroyListener:this.onDestroyListener,
        updateCommentSettings(settings: CommentSettingsDialog){
          this.updateCommentSettings(settings);
        }
      }
    );
  }

  ngOnDestroy(){
    super.ngOnDestroy();
    this.onDestroyListener.emit();
  }

  ngAfterContentInit(): void{
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 700);
  }

  ngAfterViewInit(){
    this.onAfterViewInitListener.emit();
  }

  ngOnInit(){
    window.scroll(0, 0);
    this.route.params.subscribe(params => {
      this.initializeRoom(params['shortId']);
    });
    this.translateService.use(localStorage.getItem('currentLang'));
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true && this.eventService.focusOnInput === false){
        document.getElementById('question_answer-button').focus();
      }else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true && this.eventService.focusOnInput === false){
        this.liveAnnouncer.clear();
        this.liveAnnouncer.announce('Aktueller Raum-Code:' + this.room.shortId);
      }else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape, KeyboardKey.Digit9) === true && this.eventService.focusOnInput === false
      ){
        this.announce();
      }else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true && this.eventService.focusOnInput === true){
        document.getElementById('question_answer-button').focus();
        this.eventService.makeFocusOnInputFalse();
      }
    });
    this.onInitListener.emit();
  }

  public announce(){
    this.liveAnnouncer.clear();
    const lang: string = this.translateService.currentLang;
    if (lang === 'de'){
      this.liveAnnouncer.announce('Du befindest dich in der Sitzung' + this.room.name +
        'mit dem Raum-Code' + this.room.shortId + '.' +
        'Drücke die Taste 1 um eine Frage zu stellen, die Taste 2 für das Sitzungs-Menü, ' +
        'die Taste 8 um den aktuellen Raum-Code zu hören, die Taste 0 um auf den Zurück-Button zu gelangen, ' +
        'oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
    }else{
      this.liveAnnouncer.announce('You have entered the session' + this.room.name + 'with the room code' + this.room.shortId
        + '.' + 'Press 0 to go back to the previous page, ' +
        '1 to ask a question, 2 for the session menu' +
        '8 to hear the current sesion code or 9 to repeat this announcement.');
    }

  }

  preRoomLoadHook(): Observable<any>{
    this.authenticationService.watchUser.subscribe(user => this.user = user);
    if (!this.user){
      return this.authenticationService.guestLogin(UserRole.PARTICIPANT).pipe(map((user) => {
        return user;
      }));
    }else{
      return of(this.user);
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

  postRoomLoadHook(){
    if (!this.authenticationService.hasAccess(this.room.shortId, UserRole.PARTICIPANT)){
      this.authenticationService.setAccess(this.room.shortId, UserRole.PARTICIPANT);
      this.roomService.addToHistory(this.room.id);
    }
    this.authenticationService.checkAccess(this.room.shortId);
  }
}
