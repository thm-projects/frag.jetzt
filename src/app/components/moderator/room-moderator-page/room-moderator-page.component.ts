import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-room-moderator-page',
  templateUrl: './room-moderator-page.component.html',
  styleUrls: ['./room-moderator-page.component.scss']
})
export class RoomModeratorPageComponent extends RoomPageComponent implements OnInit {

  room: Room;
  isLoading = true;
  deviceType = localStorage.getItem('deviceType');
  moderatorCommentCounter: number;


  constructor(protected location: Location,
              protected roomService: RoomService,
              protected route: ActivatedRoute,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService) {
    super(roomService, route, location, wsCommentService, commentService);
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  initializeRoom(id: string): void {
    this.roomService.getRoomByShortId(id).subscribe(room => {
      this.room = room;
      this.isLoading = false;
      this.commentService.countByRoomId(this.room.id, true)
        .subscribe(commentCounter => {
          this.commentCounter = commentCounter;
        });

      this.commentService.countByRoomId(this.room.id, false).subscribe(commentCounter => {
        this.moderatorCommentCounter = commentCounter;
      });

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

  ngOnInit() {
    window.scroll(0, 0);
    this.route.params.subscribe(params => {
      this.initializeRoom(params['roomId']);
    });
    this.translateService.use(localStorage.getItem('currentLang'));
  }
}
