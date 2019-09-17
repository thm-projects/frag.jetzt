import { Component, OnInit, Renderer2, OnDestroy, AfterContentInit } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Location } from '@angular/common';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';
import { Message } from '@stomp/stompjs';
import { NotificationService } from '../../../services/util/notification.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';

@Component({
  selector: 'app-room-moderator-page',
  templateUrl: './room-moderator-page.component.html',
  styleUrls: ['./room-moderator-page.component.scss']
})
export class RoomModeratorPageComponent extends RoomPageComponent implements OnInit, OnDestroy, AfterContentInit {

  room: Room;
  isLoading = true;
  deviceType = localStorage.getItem('deviceType');
  moderatorCommentCounter: number;
  viewModuleCount = 1;

  listenerFn: () => void;

  constructor(protected location: Location,
              protected roomService: RoomService,
              protected route: ActivatedRoute,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService,
              protected notification: NotificationService,
              public eventService: EventService,
              private liveAnnouncer: LiveAnnouncer,
              private _r: Renderer2) {
    super(roomService, route, location, wsCommentService, commentService);
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  initializeRoom(id: string): void {
    this.roomService.getRoomByShortId(id).subscribe(room => {
      this.room = room;
      this.isLoading = false;
      if (this.room.extensions && this.room.extensions['comments']) {
        if (this.room.extensions['comments'].enableModeration !== null) {
          this.moderationEnabled = this.room.extensions['comments'].enableModeration;
          this.viewModuleCount = this.viewModuleCount + 1;
        }
      }
      this.commentService.countByRoomId(this.room.id, true).subscribe(commentCounter => {
          this.commentCounter = commentCounter;
      });
      if (this.moderationEnabled) {
        this.commentService.countByRoomId(this.room.id, false).subscribe(commentCounter => {
          this.moderatorCommentCounter = commentCounter;
        });
      }

      this.wsCommentService.getCommentStream(this.room.id).subscribe((message: Message) => {
        const msg = JSON.parse(message.body);
        const payload = msg.payload;
        if (msg.type === 'CommentCreated') {
          this.commentCounter = this.commentCounter + 1;
        } else if (msg.type === 'CommentDeleted') {
          this.commentCounter = this.commentCounter - 1;
        } else if (msg.type === 'CommentPatched') {
          for (const [key, value] of Object.entries(payload.changes)) {
            switch (key) {
              case 'ack':
                const isNowAck = <boolean>value;
                if (isNowAck) {
                  this.commentCounter = this.commentCounter + 1;
                  this.moderatorCommentCounter = this.moderatorCommentCounter - 1;
                } else {
                  this.commentCounter = this.commentCounter - 1;
                  this.moderatorCommentCounter = this.moderatorCommentCounter + 1;
                }
                break;
            }
          }
        }
      });
    });
  }

  ngAfterContentInit(): void {
    setTimeout( () => {
      document.getElementById('live_announcer-button').focus();
    }, 700);
  }

  ngOnInit() {
    window.scroll(0, 0);
    this.route.params.subscribe(params => {
      this.initializeRoom(params['roomId']);
    });
    this.translateService.use(localStorage.getItem('currentLang'));
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true && this.eventService.focusOnInput === false) {
        document.getElementById('question_answer-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true && this.eventService.focusOnInput === false) {
        document.getElementById('gavel-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit8) === true && this.eventService.focusOnInput === false) {
        this.liveAnnouncer.clear();
        this.liveAnnouncer.announce('Aktueller Sitzungs-Name: ' + this.room.name + '. ' +
          'Aktueller Sitzungs-Code: ' + this.room.shortId.slice(0, 8));
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

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
  }

  public announce() {
    this.liveAnnouncer.announce('Du befindest dich in der Sitzung in der du als Moderator gewählt wurdest. ' +
      'Drücke die Taste 1 um auf die Fragen-Übersicht zu gelangen, ' +
      'die Taste 2 um das Sitzungs-Menü zu öffnen, die Taste 3 um in die Moderationsübersicht zu gelangen, ' +
      'die Taste 4 um Einstellungen an der Sitzung vorzunehmen, ' +
      'die Taste 8 um den aktuellen Sitzungs-Code zu hören, die Taste 0 um auf den Zurück-Button zu gelangen, ' +
      'oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
  }

  copyShortId(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.room.shortId;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.translateService.get('room-page.session-id-copied').subscribe(msg => {
      this.notification.show(msg, '', { duration: 2000 });
    });
  }
}
