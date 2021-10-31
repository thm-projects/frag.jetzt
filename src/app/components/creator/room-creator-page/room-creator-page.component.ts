import { AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Location } from '@angular/common';
import { NotificationService } from '../../../services/util/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { CommentService } from '../../../services/http/comment.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { TitleService } from '../../../services/util/title.service';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { HeaderService } from '../../../services/util/header.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { RoomEditComponent } from '../_dialogs/room-edit/room-edit.component';
import { ModeratorService } from '../../../services/http/moderator.service';

@Component({
  selector:'app-room-creator-page',
  templateUrl:'./room-creator-page.component.html',
  styleUrls:['./room-creator-page.component.scss']
})
export class RoomCreatorPageComponent extends RoomPageComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit{
  commentCounterEmitSubscription: any;

  constructor(protected roomService: RoomService,
              protected notification: NotificationService,
              protected route: ActivatedRoute,
              protected location: Location,
              public dialog: MatDialog,
              protected translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentService,
              protected commentService: CommentService,
              private liveAnnouncer: LiveAnnouncer,
              private _r: Renderer2,
              public eventService: EventService,
              public titleService: TitleService,
              protected bonusTokenService: BonusTokenService,
              protected moderatorService: ModeratorService,
              public router: Router,
              public authenticationService: AuthenticationService,
              public headerService: HeaderService,
              public composeService: ArsComposeService){
    super(roomService, route, location, wsCommentService, commentService, eventService, headerService, composeService,
      dialog, bonusTokenService, translateService, notification, authenticationService, moderatorService);
    this.commentCounterEmitSubscription = this.commentCounterEmit.subscribe(e => {
      this.titleService.attachTitle('(' + e + ')');
    });
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngAfterViewInit(){
    this.tryInitNavigation();
  }

  ngOnDestroy(){
    super.ngOnDestroy();
    this.commentCounterEmitSubscription.unsubscribe();
    this.titleService.resetTitle();
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

  showSettingsDialog(): void {
    const updRoom = JSON.parse(JSON.stringify(this.room));
    const dialogRef = this.dialog.open(RoomEditComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.editRoom = updRoom;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'abort') {
          return;
        } else if (result !== 'delete') {
          this.saveChanges(updRoom);
        }
      });
    dialogRef.backdropClick().subscribe(res => {
      dialogRef.close('abort');
    });
  }
}

