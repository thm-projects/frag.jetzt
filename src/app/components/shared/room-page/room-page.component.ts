import { Component, OnInit, OnDestroy } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';
import { EventService } from '../../../services/util/event.service';
import { Message, IMessage } from '@stomp/stompjs';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-room-page',
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss']
})
export class RoomPageComponent implements OnInit, OnDestroy {
  room: Room = null;
  isLoading = true;
  commentCounter: number;
  protected moderationEnabled = false;
  protected sub: Subscription;
  protected commentWatch: Observable<IMessage>;
  protected listenerFn: () => void;

  constructor(protected roomService: RoomService,
              protected route: ActivatedRoute,
              protected location: Location,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService,
              protected eventService: EventService
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.initializeRoom(params['roomId']);
    });
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  protected afterRoomLoadHook() {

  }

  initializeRoom(id: string): void {
    this.roomService.getRoomByShortId(id).subscribe(room => {
      this.room = room;
      this.isLoading = false;
      if (this.room.extensions && this.room.extensions['comments']) {
        if (this.room.extensions['comments'].enableModeration !== null) {
          this.moderationEnabled = this.room.extensions['comments'].enableModeration;
          // ToDo: make room data cache that's available for components that manages data flow and put that there
        }
      }
      localStorage.setItem('moderationEnabled', String(this.moderationEnabled));
      this.commentService.countByRoomId(this.room.id, true)
        .subscribe(commentCounter => {
          this.commentCounter = commentCounter;
        });
      this.commentWatch = this.wsCommentService.getCommentStream(this.room.id);
      this.sub = this.commentWatch.subscribe((message: Message) => {
        const msg = JSON.parse(message.body);
        const payload = msg.payload;
        if (msg.type === 'CommentCreated') {
          this.commentCounter = this.commentCounter + 1;
        } else if (msg.type === 'CommentDeleted') {
          this.commentCounter = this.commentCounter - 1;
        }
      });
      this.afterRoomLoadHook();
    });
  }

  delete(room: Room): void {
    this.roomService.deleteRoom(room.id).subscribe();
    this.location.back();
  }
}
