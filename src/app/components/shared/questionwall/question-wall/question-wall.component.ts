import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { CorrectWrong } from '../../../../models/correct-wrong.enum';

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
  commentsFilter: QuestionWallComment[] = [];
  commentFocus: QuestionWallComment;
  unreadComments = 0;
  focusIncommingComments = false;
  timeUpdateInterval;
  keySupport: QuestionWallKeyEventSupport;
  hasFilter = false;
  filterTitle = '';
  filterDesc = '';
  filterIcon = '';
  isSvgIcon = false;
  userMap: Map<number, number> = new Map<number, number>();
  userList = [];
  userSelection = false;
  tags;

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
    this.langService.langEmitter.subscribe(lang => {
      this.translateService.use(lang);
      QuestionWallComment.updateTimeFormat(lang);
    });
  }

  ngOnInit(): void {
    // StyleDebug.border('c');
    QuestionWallComment.updateTimeFormat(localStorage.getItem('currentLang'));
    this.translateService.use(localStorage.getItem('currentLang'));
    this.commentService.getAckComments(this.roomId).subscribe(e => {
      e.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      e.forEach(c => {
        const comment = new QuestionWallComment(c, true);
        this.comments.push(comment);
      });
    });
    this.roomService.getRoom(this.roomId).subscribe(e => {
      this.room = e;
      this.tags = e.extensions['tags']['tags'];
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
    document.getElementById('header_rescale').style.display = 'none';
    document.getElementById('footer_rescale').style.display = 'none';
    setTimeout(() => {
      Rescale.requestFullscreen();
    }, 10);
  }

  ngOnDestroy(): void {
    this.keySupport.destroy();
    window.clearInterval(this.timeUpdateInterval);
    document.getElementById('header_rescale').style.display = 'block';
    document.getElementById('footer_rescale').style.display = 'block';
    Rescale.exitFullscreen();
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
    return this.getCurrentCommentList().indexOf(this.commentFocus);
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
    this.comments = [qwComment, ...this.comments];
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

  createUserMap() {
    this.userMap = new Map();
    this.comments.forEach(c => {
      if (!this.userMap.has(c.comment.userNumber)) {
        this.userMap.set(c.comment.userNumber, 0);
      }
      this.userMap.set(c.comment.userNumber, this.userMap.get(c.comment.userNumber) + 1);
    });
    this.userList = [];
    this.userMap.forEach((num, user) => {
      this.userList.push([num, user]);
    });
  }

  applyUserMap(user: number) {
    this.userSelection = false;
    this.filterUserByNumber(user);
  }

  openUserMap() {
    if (this.userSelection) {return; }
    this.hasFilter = false;
    this.createUserMap();
    this.userSelection = true;
  }

  cancelUserMap() {
    this.userSelection = false;
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
    const commentList = this.getCurrentCommentList();
    if (reverse) {
      commentList.sort(this.reverse(fun));
    } else {
      commentList.sort(fun);
    }
    setTimeout(() => {
      if (commentList.length > 1) {
        this.focusComment(commentList[0]);
      }
    }, 0);
  }

  getCurrentCommentList() {
    if (this.hasFilter) {
      return this.commentsFilter;
    } else {
      return this.comments;
    }
  }

  reverse(fun: (a, b) => number): (a, b) => number {
    return (a, b) => fun(b, a);
  }

  filterFavorites() {
    this.filter('star', false, 'question-wall.filter-favorite', '',
        x => x.comment.favorite);
  }

  filterUser(comment: QuestionWallComment) {
    this.filterUserByNumber(comment.comment.userNumber);
  }

  filterUserByNumber(user: number) {
    this.filter('person', false, 'question-wall.filter-user', user + '',
      x => x.comment.userNumber === user);
  }

  filterApproved() {
    this.filter('check_circle', false, 'question-wall.filter-approved', '',
        x => x.comment.correct === CorrectWrong.CORRECT);
  }

  filterDisapproved() {
    this.filter('block', false, 'question-wall.filter-disapproved', '',
        x => x.comment.correct === CorrectWrong.WRONG);
  }

  filterTag(tag: string) {
    this.filter('comment_tag', true, '', tag, x => x.comment.tag === tag);
  }

  filter(icon: string, isSvgIcon: boolean, title: string, desc: string, filter: (x: QuestionWallComment) => boolean) {
    this.cancelUserMap();
    this.filterIcon = icon;
    this.isSvgIcon = isSvgIcon;
    this.filterTitle = title;
    this.filterDesc = desc;
    this.commentsFilter = this.comments.filter(filter);
    this.hasFilter = true;
    setTimeout(() => this.focusFirstComment(), 0);
  }

  focusFirstComment() {
    if (this.getCurrentCommentList().length > 0) {
      this.commentFocus = this.getCurrentCommentList()[0];
    }
  }

  deactivateFilter() {
    this.hasFilter = false;
  }

  toggleFilter() {
    this.hasFilter = !this.hasFilter;
  }

}
