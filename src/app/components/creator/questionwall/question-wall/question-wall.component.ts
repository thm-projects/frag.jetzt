import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StyleDebug } from '../../../../../../projects/ars/src/lib/models/debug/StyleDebug';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment } from '../../../../models/comment';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { WsCommentServiceService } from '../../../../services/websockets/ws-comment-service.service';
import { QuestionWallComment } from '../QuestionWallComment';
import { ColComponent } from '../../../../../../projects/ars/src/lib/components/layout/frame/col/col.component';

@Component({
  selector: 'app-question-wall',
  templateUrl: './question-wall.component.html',
  styleUrls: ['./question-wall.component.scss']
})
export class QuestionWallComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(ColComponent)colComponent: ColComponent;

  roomId: string;
  room: Room;
  comments: QuestionWallComment[] = [];
  commentFocus: QuestionWallComment;
  unreadComments = 0;
  focusIncommingComments = false;

  static wrap<E>(e: E, action: (e: E) => void) {
    action(e);
  }

  constructor(
    private commentService: CommentService,
    private roomService: RoomService,
    private wsCommentService: WsCommentServiceService
  ) {
    this.roomId = localStorage.getItem('roomId');
  }

  ngOnInit(): void {
    // StyleDebug.border('c');
    this.commentService.getAckComments(this.roomId).subscribe(e => {
      e.forEach(c => {
        this.comments.push(new QuestionWallComment(c, true));
      });
    });
    this.roomService.getRoom(this.roomId).subscribe(e => {
      this.room = e;
    });
    this.wsCommentService.getCommentStream(this.roomId).subscribe(e => {
      this.commentService.getComment(JSON.parse(e.body).payload.id).subscribe(c => {
        const qwComment = this.pushIncommingComment(c);
        if (this.focusIncommingComments) {
          this.focusComment(qwComment);
        }
      });
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

  nextComment() {
    this.moveComment(1);
  }

  prevComment() {
    this.moveComment(-1);
  }

  moveComment(fx: number) {
    if (this.comments.length === 0) {
      return;
    } else if (!this.commentFocus) {
      this.focusComment(this.comments[0]);
    } else {
      const cursor = this.comments.indexOf(this.commentFocus);
      if (cursor + fx >= this.comments.length || cursor + fx < 0) {
        return;
      } else {
        this.focusComment(this.comments[cursor + fx]);
      }
    }
  }

  pushIncommingComment(comment: Comment): QuestionWallComment {
    const qwComment = new QuestionWallComment(comment, false);
    this.comments.push(qwComment);
    this.unreadComments++;
    return qwComment;
  }

  focusComment(comment: QuestionWallComment) {
    this.commentFocus = comment;
    if (!comment.old) {
      comment.old = true;
      this.unreadComments--;
    }
    setTimeout(() => {
      QuestionWallComponent.wrap(this.colComponent.ref.nativeElement, e => e.scrollTop = e.scrollHeight);
    }, 10);
  }

  play() {
    this.focusIncommingComments = true;
  }

  stop() {
    this.focusIncommingComments = false;
  }

}
