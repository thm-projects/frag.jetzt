import { Component, OnInit, OnDestroy } from '@angular/core';
import { Room } from '../../../models/room';
import { User } from '../../../models/user';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';
import { EventService } from '../../../services/util/event.service';
import { Message, IMessage } from '@stomp/stompjs';
import { Observable, Subscription, of } from 'rxjs';
import { TitleService } from '../../../services/util/title.service';

@Component({
  selector: 'app-room-page',
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss']
})
export class RoomPageComponent implements OnInit, OnDestroy {
  room: Room = null;
  isLoading = true;
  commentCounter: number;
  protected moderationEnabled = true;
  protected sub: Subscription;
  protected commentWatch: Observable<IMessage>;
  protected listenerFn: () => void;

  constructor(protected roomService: RoomService,
              protected route: ActivatedRoute,
              protected location: Location,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService,
              protected eventService: EventService,
              public titleService: TitleService
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.initializeRoom(params['shortId']);
    });
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  protected preRoomLoadHook(): Observable<any> {
    return of('');
  }

  protected postRoomLoadHook() {

  }

  initializeRoom(id: string): void {
    this.preRoomLoadHook().subscribe(user => {
      this.roomService.getRoomByShortId(id).subscribe(room => {
        this.room = room;
        this.isLoading = false;
        this.moderationEnabled = this.room.moderated;
        localStorage.setItem('moderationEnabled', String(this.moderationEnabled));
        this.commentService.countByRoomId(this.room.id, true)
          .subscribe(commentCounter => {
            this.setCommentCounter(commentCounter);
          });
        this.commentWatch = this.wsCommentService.getCommentStream(this.room.id);
        this.sub = this.commentWatch.subscribe((message: Message) => {
          const msg = JSON.parse(message.body);
          const payload = msg.payload;
          if (msg.type === 'CommentCreated') {
            this.setCommentCounter(this.commentCounter + 1);
          } else if (msg.type === 'CommentDeleted') {
            this.setCommentCounter(this.commentCounter - 1);
          }
        });
        this.postRoomLoadHook();
      });
    });
  }

  setCommentCounter(commentCounter: number) {
    this.titleService.attachTitle('(' + commentCounter + ')');
    this.commentCounter = commentCounter;
  }

  delete(room: Room): void {
    this.roomService.deleteRoom(room.id).subscribe();
    this.location.back();
  }
}
