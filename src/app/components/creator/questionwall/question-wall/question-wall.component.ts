import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { StyleDebug } from '../../../../../../projects/ars/src/lib/models/debug/StyleDebug';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment } from '../../../../models/comment';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';

@Component({
  selector: 'app-question-wall',
  templateUrl: './question-wall.component.html',
  styleUrls: ['./question-wall.component.scss']
})
export class QuestionWallComponent implements OnInit, AfterViewInit, OnDestroy {

  roomId: string;
  room: Room;
  comments: Comment[];
  commentFocus: Comment;

  constructor(
    private commentService: CommentService,
    private roomService: RoomService
  ) {
    this.roomId = localStorage.getItem('roomId');
  }

  ngOnInit(): void {
    // StyleDebug.border('c');
    this.commentService.getAckComments(this.roomId).subscribe(e => {
      this.comments = e;
    });
    this.roomService.getRoom(this.roomId).subscribe(e => {
      this.room = e;
    });
  }

  ngAfterViewInit(): void {
    document.getElementById('header_rescale').style.display = 'none';
    document.getElementById('footer_rescale').style.display = 'none';
  }

  ngOnDestroy(): void {
    document.getElementById('header_rescale').style.display = 'block';
    document.getElementById('footer_rescale').style.display = 'block';
  }

  focusComment(comment: Comment) {
    this.commentFocus = comment;
  }

}
