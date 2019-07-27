import { Component, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';
import { Message } from '@stomp/stompjs';

@Component({
  selector: 'app-room-page',
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss']
})
export class RoomPageComponent implements OnInit {
  room: Room = null;
  isLoading = true;
  commentCounter: number;

  constructor(protected roomService: RoomService,
              protected route: ActivatedRoute,
              protected location: Location,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService
  ) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.initializeRoom(params['roomId']);
    });
  }

  initializeRoom(id: string): void {
    this.roomService.getRoomByShortId(id).subscribe(room => {
      this.room = room;
      this.isLoading = false;
      this.commentService.countByRoomId(this.room.id, true)
        .subscribe(commentCounter => {
          this.commentCounter = commentCounter;
        });
      this.wsCommentService.getCommentStream(this.room.id).subscribe((message: Message) => {
        const msg = JSON.parse(message.body);
        const payload = msg.payload;
        if (msg.type === 'CommentCreated') {
          this.commentCounter = this.commentCounter + 1;
        } else if (msg.type === 'CommentDeleted') {
          this.commentCounter = this.commentCounter - 1;
        }
      });
    });
  }

  delete(room: Room): void {
    this.roomService.deleteRoom(room.id).subscribe();
    this.location.back();
  }
}
