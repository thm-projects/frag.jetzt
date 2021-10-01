import { AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../../models/user';
import { NotificationService } from '../../../services/util/notification.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { Room } from '../../../models/room';
import { HeaderService } from '../../../services/util/header.service';
import { RoomService } from '../../../services/http/room.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';
import { CommentService } from '../../../services/http/comment.service';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';

@Component({
  selector: 'app-moderator-comment-page',
  templateUrl: './moderator-comment-page.component.html',
  styleUrls: ['./moderator-comment-page.component.scss']
})
export class ModeratorCommentPageComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {
  roomId: string;
  user: User;
  room: Room;

  listenerFn: () => void;

  constructor(protected route: ActivatedRoute,
              private notification: NotificationService,
              private authenticationService: AuthenticationService,
              public eventService: EventService,
              private _r: Renderer2,
              private liveAnnouncer: LiveAnnouncer,
              public headerService:HeaderService,
              public roomService:RoomService,
              public composeService:ArsComposeService,
              public dialog:MatDialog,
              public translationService:TranslateService,
              public location:Location,
              public commentService:CommentService,
              public bonusTokenService:BonusTokenService,
              public wsCommentService:WsCommentService) {
  }

  ngAfterContentInit(): void {
    setTimeout( () => {
      document.getElementById('live_announcer-button').focus();
    }, 500);
  }

  ngAfterViewInit(){
  }

  ngOnInit(): void {
    this.roomId = localStorage.getItem('roomId');
    this.user = this.authenticationService.getUser();
    this.announce();
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true && this.eventService.focusOnInput === false) {
        document.getElementById('searchBox').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true && this.eventService.focusOnInput === false) {
        document.getElementById('sort-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit4) === true && this.eventService.focusOnInput === false) {
        document.getElementById('filter-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true && this.eventService.focusOnInput === false) {
        this.liveAnnouncer.announce('Aktueller Sitzungs-' + document.getElementById('shortId-header').textContent);
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit9, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === false) {
        this.announce();
      } else if (
        document.getElementById('search_close-button') &&
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === true) {
        document.getElementById('search_close-button').click();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true && this.eventService.focusOnInput === true) {
        this.eventService.makeFocusOnInputFalse();
        document.getElementById('sort-button').focus();
      }
    });
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
  }

  public announce() {
    this.liveAnnouncer.clear();
    this.liveAnnouncer.announce('Du befindest dich auf der Moderations-Seite deiner Sitzung. ' +
      'Drücke die Taste 2 um auf das Sitzungs-Menü zu gelangen, ' +
      'die Taste 8 um den aktuellen Raum-Code zu hören, oder die Taste 0 um zurück zur Benutzer-Seite zu gelangen. ' +
      'Sobald mehrere Fragen vorhanden sind kannst du Fragen suchen und filtern. Mit Taste 1 gelangst du in das Suchfeld,' +
      'durch drücken der Escape-Taste wird die Sucheingabe gelöscht. Drücke die Taste 3 um Fragen zu sortieren, ' +
      'die Taste 4 um Fragen zu filtern, oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
  }
}
