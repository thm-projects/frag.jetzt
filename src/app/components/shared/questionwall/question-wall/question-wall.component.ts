import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { StyleDebug } from '../../../../../../projects/ars/src/lib/models/debug/StyleDebug';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment } from '../../../../models/comment';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { WsCommentServiceService } from '../../../../services/websockets/ws-comment-service.service';
import { QuestionWallComment } from '../QuestionWallComment';
import { ColComponent } from '../../../../../../projects/ars/src/lib/components/layout/frame/col/col.component';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { LanguageService } from '../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { Rescale } from '../../../../models/rescale';
import { QuestionWallKeyEventSupport } from '../QuestionWallKeyEventSupport';

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
  timeUpdateInterval;
  keySupport: QuestionWallKeyEventSupport;

  public wrap<E>(e: E, action: (e: E) => void) {
    action(e);
  }

  public notUndefined<E>(e: E, action: (e: E) => void, elsePart?: () => void) {
    if (e) {action(e); } else if (elsePart) {elsePart(); }
  }

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
    private commentService: CommentService,
    private roomService: RoomService,
    private wsCommentService: WsCommentServiceService,
    private langService: LanguageService,
    private translateService: TranslateService
  ) {
    this.keySupport = new QuestionWallKeyEventSupport();
    this.roomId = localStorage.getItem('roomId');
    this.timeUpdateInterval = setInterval(() => {
      this.comments.forEach(e => e.updateTimeAgo());
    }, 15000);
    this.langService.langEmitter.subscribe(lang => this.translateService.use(lang));
  }

  ngOnInit(): void {
    // StyleDebug.border('c');
    this.translateService.use(localStorage.getItem('currentLang'));
    this.commentService.getAckComments(this.roomId).subscribe(e => {
      e.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      e.forEach(c => this.comments.push(new QuestionWallComment(c, true)));
    });
    this.roomService.getRoom(this.roomId).subscribe(e => {
      this.room = e;
    });
    this.wsCommentService.getCommentStream(this.roomId).subscribe(e => {
      this.commentService.getComment(JSON.parse(e.body).payload.id).subscribe(comment => {
        this.notUndefined(this.comments.find(f => f.comment.id === comment.id), qwComment => {
          qwComment.comment = comment;
        }, () => {
          this.wrap(this.pushIncommingComment(comment), qwComment => {
            if (this.focusIncommingComments) {
              setTimeout(() => this.focusComment(qwComment), 5);
            }
          });
        });
      });
    });
    this.initKeySupport();
  }

  initKeySupport() {
    this.wrap(this.keySupport, key => {
      key.addKeyEvent('ArrowRight', () => this.nextComment());
      key.addKeyEvent('ArrowLeft', () => this.prevComment());
      key.addKeyEvent(' ', () => this.nextComment());
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      Rescale.requestFullscreen();
    }, 10);
    document.getElementById('header_rescale').style.display = 'none';
    document.getElementById('footer_rescale').style.display = 'none';
  }

  ngOnDestroy(): void {
    this.keySupport.destroy();
    window.clearInterval(this.timeUpdateInterval);
    document.getElementById('header_rescale').style.display = 'block';
    document.getElementById('footer_rescale').style.display = 'block';
  }

  nextComment() {
    this.moveComment(1);
  }

  prevComment() {
    this.moveComment(-1);
  }

  getDOMComments() {
    return Array.from(document.getElementsByClassName('questionwall-comment-anchor'));
  }

  getDOMCommentFocus() {
    return this.getDOMComments()[this.getCommentFocusIndex()];
  }

  getCommentFocusIndex() {
    return this.comments.indexOf(this.commentFocus);
  }

  moveComment(fx: number) {
    if (this.comments.length === 0) {
      return;
    } else if (!this.commentFocus) {
      this.focusComment(this.comments[0]);
    } else {
      const cursor = this.getCommentFocusIndex();
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
    this.getDOMCommentFocus().scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  toggleFocusIncommingComments() {
    this.focusIncommingComments = !this.focusIncommingComments;
  }

  leave() {
    document.getElementById('back-button').click();
  }

  likeComment(comment: QuestionWallComment) {
    this.wsCommentService.voteUp(comment.comment, this.authenticationService.getUser().id);
  }

  dislikeComment(comment: QuestionWallComment) {
    this.wsCommentService.voteDown(comment.comment, this.authenticationService.getUser().id);
  }

  sortScore(reverse?: boolean) {
    this.sort((a, b) => a.comment.score - b.comment.score, reverse);
  }

  sortTime(reverse?: boolean) {
    this.sort((a, b) => new Date(a.comment.timestamp).getTime() - new Date(b.comment.timestamp).getTime(), reverse);
  }

  sort(fun: (a, b) => number, reverse: boolean) {
    if (reverse) {
      this.comments.sort(this.reverse(fun));
    } else {
      this.comments.sort(fun);
    }
    setTimeout(() => {
      this.focusComment(this.comments[this.comments.length - 1]);
    }, 0);
  }

  reverse(fun: (a, b) => number): (a, b) => number {
    return (a, b) => fun(b, a);
  }

}
