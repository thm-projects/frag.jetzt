import { Component, OnInit, Renderer2, OnDestroy, AfterContentInit, AfterViewInit } from '@angular/core';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Location } from '@angular/common';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { MatDialog } from '@angular/material/dialog';
import { HeaderService } from '../../../services/util/header.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { SessionService } from '../../../services/util/session.service';
import { RoomDataService } from '../../../services/util/room-data.service';
import { DeviceInfoService } from '../../../services/util/device-info.service';

@Component({
  selector: 'app-room-moderator-page',
  templateUrl: './room-moderator-page.component.html',
  styleUrls: ['./room-moderator-page.component.scss']
})
export class RoomModeratorPageComponent extends RoomPageComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {

  constructor(
    protected location: Location,
    protected roomService: RoomService,
    protected route: ActivatedRoute,
    protected translateService: TranslateService,
    protected dialog: MatDialog,
    protected langService: LanguageService,
    protected commentService: CommentService,
    protected notification: NotificationService,
    protected headerService: HeaderService,
    protected composeService: ArsComposeService,
    protected bonusTokenService: BonusTokenService,
    protected authenticationService: AuthenticationService,
    public eventService: EventService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2,
    protected sessionService: SessionService,
    protected roomDataService: RoomDataService,
    public deviceInfo: DeviceInfoService,
  ) {
    super(roomService, route, location, commentService, eventService, headerService, composeService, dialog,
      bonusTokenService, translateService, notification, authenticationService, sessionService, roomDataService);
    langService.getLanguage().subscribe(lang => translateService.use(lang));
  }

  ngAfterViewInit() {
    this.tryInitNavigation();
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
      if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true && this.eventService.focusOnInput === false) {
        document.getElementById('question_answer-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true && this.eventService.focusOnInput === false) {
        document.getElementById('gavel-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true && this.eventService.focusOnInput === false) {
        this.liveAnnouncer.clear();
        this.liveAnnouncer.announce('Aktueller Sitzungs-Name: ' + this.room.name + '. ' +
          'Aktueller Raum-Code: ' + this.room.shortId);
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit9, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === false) {
        this.announce();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true && this.eventService.focusOnInput === true) {
        this.eventService.makeFocusOnInputFalse();
        document.getElementById('question_answer-button').focus();
      }
    });
  }

  public announce() {
    this.liveAnnouncer.announce('Du befindest dich in der Sitzung in der du als Moderator gewählt wurdest. ' +
      'Drücke die Taste 1 um auf die Fragen-Übersicht zu gelangen, ' +
      'die Taste 2 um das Sitzungs-Menü zu öffnen, die Taste 3 um in die Moderationsübersicht zu gelangen, ' +
      'die Taste 4 um Einstellungen an der Sitzung vorzunehmen, ' +
      'die Taste 8 um den aktuellen Raum-Code zu hören, die Taste 0 um auf den Zurück-Button zu gelangen, ' +
      'oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
  }
}
