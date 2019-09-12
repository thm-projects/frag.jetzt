import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Room } from '../../../models/room';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Location } from '@angular/common';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';

@Component({
  selector: 'app-room-participant-page',
  templateUrl: './room-participant-page.component.html',
  styleUrls: ['./room-participant-page.component.scss']
})
export class RoomParticipantPageComponent extends RoomPageComponent implements OnInit, OnDestroy {

  room: Room;
  isLoading = true;
  deviceType = localStorage.getItem('deviceType');
  user: User;

  listenerFn: () => void;

  constructor(protected location: Location,
              protected roomService: RoomService,
              protected route: ActivatedRoute,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService,
              private authenticationService: AuthenticationService,
              private liveAnnouncer: LiveAnnouncer,
              private _r: Renderer2,
              public eventService: EventService) {
    super(roomService, route, location, wsCommentService, commentService);
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    window.scroll(0, 0);
    this.route.params.subscribe(params => {
      this.initializeRoom(params['roomId']);
    });
    this.translateService.use(localStorage.getItem('currentLang'));
    this.announce();
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (event.keyCode === 49 && this.eventService.focusOnInput === false) {
        document.getElementById('question_answer-button').focus();
      } else if (event.keyCode === 56 && this.eventService.focusOnInput === false) {
        this.liveAnnouncer.announce('Aktueller Sitzungs-Code:' + this.room.shortId.slice(0, 8));
      } else if ((event.keyCode === 57 || event.keyCode === 27) && this.eventService.focusOnInput === false) {
        this.announce();
      } else if (event.keyCode === 27 && this.eventService.focusOnInput === true) {
        document.getElementById('question_answer-button').focus();
        this.eventService.makeFocusOnInputFalse();
      }
    });
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
  }

  public announce() {
    // this.liveAnnouncer.announce('Willkommen auf dieser Seite' + document.getElementById('announcer_text').textContent, 'assertive');
    this.liveAnnouncer.announce('Sie befinden sich in der Sitzung mit dem von Ihnen eingegebenen Sitzungs-Code. ' +
      'Drücken Sie die Taste 1 um eine Frage zu stellen, die Taste 2 für das Sitzungs-Menü, ' +
      'die Taste 8 um den aktuellen Sitzungs-Code zu hören, die Taste 0 um auf den Zurück-Button zu gelanngen, ' +
      'oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
  }

  afterRoomLoadHook() {
    this.authenticationService.watchUser.subscribe( user => this.user = user);
    if (!this.user) {
      this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(guestUser => {
        this.roomService.addToHistory(this.room.id);
      });
    }
  }
}
