import { AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Location } from '@angular/common';
import { NotificationService } from '../../../services/util/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
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
import { SessionService } from '../../../services/util/session.service';
import { RoomDataService } from '../../../services/util/room-data.service';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-room-creator-page',
  templateUrl: './room-creator-page.component.html',
  styleUrls: ['./room-creator-page.component.scss']
})
export class RoomCreatorPageComponent extends RoomPageComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {
  commentCounterEmitSubscription: Subscription;

  constructor(
    protected roomService: RoomService,
    protected notification: NotificationService,
    protected route: ActivatedRoute,
    protected location: Location,
    public dialog: MatDialog,
    protected translateService: TranslateService,
    protected langService: LanguageService,
    protected commentService: CommentService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2,
    public eventService: EventService,
    public titleService: TitleService,
    protected bonusTokenService: BonusTokenService,
    public router: Router,
    public authenticationService: AuthenticationService,
    public headerService: HeaderService,
    public composeService: ArsComposeService,
    protected sessionService: SessionService,
    protected roomDataService: RoomDataService,
    public deviceInfo: DeviceInfoService,
  ) {
    super(roomService, route, location, commentService, eventService, headerService, composeService, dialog,
      bonusTokenService, translateService, notification, authenticationService, sessionService, roomDataService,
      router);
    this.commentCounterEmitSubscription = this.commentCounterEmit.subscribe(e => {
      this.titleService.attachTitle(`(${e[0]} / ${e[1]})`);
    });
    langService.getLanguage().subscribe(lang => translateService.use(lang));
  }

  ngAfterViewInit() {
    this.tryInitNavigation();
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.commentCounterEmitSubscription.unsubscribe();
    this.titleService.resetTitle();
  }

  ngAfterContentInit(): void {
    setTimeout(() => {
      document.getElementById('live_announcer-button').focus();
    }, 700);
  }

  ngOnInit() {
    window.scroll(0, 0);
    this.initializeRoom();
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      const lang: string = this.translateService.currentLang;
      if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true && this.eventService.focusOnInput === false) {
        document.getElementById('question_answer-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true && this.eventService.focusOnInput === false) {
        document.getElementById('gavel-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit4) === true && this.eventService.focusOnInput === false) {
        document.getElementById('settings-menu').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true && this.eventService.focusOnInput === false) {
        this.liveAnnouncer.clear();
        if (lang === 'de') {
          this.liveAnnouncer.announce('Aktueller Sitzungs-Name: ' + this.room.name + '. ' +
            'Aktueller Raum-Code: ' + this.room.shortId);
        } else {
          this.liveAnnouncer.announce('Current Session-Name: ' + this.room.name + '. ' +
            'Current Session Code: ' + this.room.shortId);
        }
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit9, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.announce();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true && this.eventService.focusOnInput === true) {
        this.eventService.makeFocusOnInputFalse();
      }
    });
  }

  public announce() {
    const lang: string = this.translateService.currentLang;
    this.liveAnnouncer.clear();
    if (lang === 'de') {
      this.liveAnnouncer.announce('Du befindest dich in der von dir erstellten Sitzung. ' +
        'Drücke die Taste 1 um auf die Fragen-Übersicht zu gelangen, ' +
        'die Taste 2 um das Sitzungs-Menü zu öffnen, die Taste 3 um in die Moderationsübersicht zu gelangen, ' +
        'die Taste 4 um Einstellungen an der Sitzung vorzunehmen, ' +
        'die Taste 8 um den aktuellen Raum-Code zu hören, die Taste 0 um auf den Zurück-Button zu gelangen, ' +
        'oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
    } else {
      this.liveAnnouncer.announce('You are in the session you created. ' +
        'Press key 1 to go to the question overview, ' +
        'Press key 2 to open the session menu, key 3 to go to the moderation overview, ' +
        'Press key 4 to go to the session settings, ' +
        'Press the 8 for he current room code,  0 to go back, ' +
        'or press 9 to repeat this announcement.', 'assertive');
    }
  }
}

