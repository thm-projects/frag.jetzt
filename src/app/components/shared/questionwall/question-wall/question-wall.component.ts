import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment } from '../../../../models/comment';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { WsCommentService } from '../../../../services/websockets/ws-comment.service';
import { QuestionWallComment } from '../QuestionWallComment';
import { ColComponent } from '../../../../../../projects/ars/src/lib/components/layout/frame/col/col.component';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { LanguageService } from '../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { Rescale } from '../../../../models/rescale';
import { QuestionWallKeyEventSupport } from '../QuestionWallKeyEventSupport';
import { MatSliderChange } from '@angular/material/slider';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { CommentListFilter, FilterType, Period, SortType } from '../../comment-list/comment-list.filter';
import { User } from '../../../../models/user';
import { UserRole } from '../../../../models/user-roles.enum';
import { SessionService } from '../../../../services/util/session.service';
import { SyncFence } from '../../../../utils/SyncFence';

@Component({
  selector: 'app-question-wall',
  templateUrl: './question-wall.component.html',
  styleUrls: ['./question-wall.component.scss']
})
export class QuestionWallComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(ColComponent) colComponent: ColComponent;
  @ViewChild('sidelist') sidelist: ColComponent;

  sidelistExpanded = true;
  qrCodeExpanded = false;
  roomId: string;
  room: Room;
  comments: QuestionWallComment[] = [];
  commentsFilteredByTime: QuestionWallComment[] = [];
  commentsFilter: QuestionWallComment[] = [];
  currentCommentList: QuestionWallComponent[] = [];
  commentFocus: QuestionWallComment;
  commentsCountQuestions = 0;
  commentsCountUsers = 0;
  unreadComments = 0;
  focusIncommingComments = true;
  timeUpdateInterval;
  keySupport: QuestionWallKeyEventSupport;
  filterTitle = '';
  filterDesc = '';
  filterIcon = '';
  isSvgIcon = false;
  userMap: Map<number, number> = new Map<number, number>();
  userList = [];
  userSelection = false;
  tags;
  fontSize = 180;
  periodsList = Object.values(Period);
  isLoading = true;
  user: User;
  animationTrigger = true;
  firstPassIntroduction = true;
  listFilter: CommentListFilter;
  private fence = new SyncFence(3, () => {
    this.isLoading = false;
    this.updateFiltering();
  });

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router,
    private commentService: CommentService,
    private roomService: RoomService,
    private wsCommentService: WsCommentService,
    private langService: LanguageService,
    private translateService: TranslateService,
    private roomDataService: RoomDataService,
    private sessionService: SessionService,
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
    this.listFilter = CommentListFilter.loadFilter('presentation');
  }

  public wrap<E>(e: E, action: (e: E) => void) {
    action(e);
  }

  public notUndefined<E>(e: E, action: (e: E) => void, elsePart?: () => void) {
    if (e) {
      action(e);
    } else if (elsePart) {
      elsePart();
    }
  }

  toggleSideList() {
    this.sidelistExpanded = !this.sidelistExpanded;
    if (this.sidelistExpanded) {
      this.sidelist.setPx(450);
    } else {
      this.sidelist.setPx(0);
    }
  }

  getURL() {
    if (!this.room) {
      return '';
    }
    return `${window.location.protocol}//${window.location.hostname}/participant/room/${this.room.shortId}`;
  }

  toggleQRCode() {
    this.qrCodeExpanded = !this.qrCodeExpanded;
  }

  ngOnInit(): void {
    QuestionWallComment.updateTimeFormat(localStorage.getItem('currentLang'));
    this.translateService.use(localStorage.getItem('currentLang'));
    this.listFilter.updateUserId(this.authenticationService.getUser()?.id);
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
        this.listFilter.updateUserId(this.user.id);
      }
    });
    this.roomDataService.getRoomData(this.roomId).subscribe(e => {
      if (e === null) {
        return;
      }
      e.forEach(c => {
        this.roomDataService.checkProfanity(c);
        const comment = new QuestionWallComment(c, true);
        this.comments.push(comment);
      });
      this.refreshUserMap();
      this.fence.resolveCondition(0);
    });
    this.roomService.getRoom(this.roomId).subscribe(e => {
      this.room = e;
      this.tags = e.tags;
    });
    const subscription = this.sessionService.getRoom().subscribe(room => {
      if (!room) {
        return;
      }
      setTimeout(() => subscription.unsubscribe());
      this.room = room;
      this.tags = room.tags;
      this.listFilter.updateRoom(room);
      this.fence.resolveCondition(1);
    });
    const moderatorSubscription = this.sessionService.getModerators().subscribe(mods => {
      if (!mods) {
        return;
      }
      setTimeout(() => moderatorSubscription.unsubscribe());
      this.listFilter.updateModerators(mods.map(mod => mod.accountId));
      this.fence.resolveCondition(2);
    });
    this.subscribeCommentStream();
    this.initKeySupport();
  }

  subscribeCommentStream() {
    this.roomDataService.receiveUpdates([
      { type: 'CommentCreated', finished: true },
      { type: 'CommentPatched', finished: true, updates: ['upvotes'] },
      { type: 'CommentPatched', finished: true, updates: ['downvotes'] },
      { finished: true }
    ]).subscribe(update => {
      if (update.type === 'CommentCreated') {
        this.wrap(this.pushIncommingComment(update.comment), qwComment => {
          if (this.focusIncommingComments) {
            setTimeout(() => this.focusComment(qwComment), 5);
          }
        });
      } else if (update.type === 'CommentPatched') {
        const qwComment = this.comments.find(f => f.comment.id === update.comment.id);
        qwComment.comment = update.comment;
      }
    });
  }

  initKeySupport() {
    this.wrap(this.keySupport, key => {
      key.addKeyEvent('ArrowRight', () => this.nextComment());
      key.addKeyEvent('ArrowLeft', () => this.prevComment());
      key.addKeyEvent('l', () => this.toggleSideList());
      key.addKeyEvent('q', () => this.toggleQRCode());
    });
  }

  ngAfterViewInit(): void {
    document.getElementById('header_rescale').style.display = 'none';
    document.getElementById('footer_rescale').style.display = 'none';
    setTimeout(() => {
      Rescale.requestFullscreen();
    }, 10);
    setTimeout(() => {
      Array.from(document.getElementsByClassName('questionwall-screen')[0].getElementsByTagName('button')).forEach(e => {
        e.addEventListener('keydown', e1 => {
          e1.preventDefault();
        });
      });
    }, 100);
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
    if (this.getCurrentCommentList().length === 0) {
      return;
    } else if (!this.commentFocus) {
      this.focusComment(this.getCurrentCommentList()[0]);
    } else {
      const cursor = this.getCommentFocusIndex();
      if (cursor + fx >= this.getCurrentCommentList().length || cursor + fx < 0) {
        return;
      } else {
        this.focusComment(this.getCurrentCommentList()[cursor + fx]);
      }
    }
  }

  pushIncommingComment(comment: Comment): QuestionWallComment {
    this.roomDataService.checkProfanity(comment);
    const qwComment = new QuestionWallComment(comment, false);
    this.comments = [qwComment, ...this.comments];
    this.refreshUserMap();
    this.unreadComments++;
    this.updateFiltering();
    return qwComment;
  }

  focusComment(comment: QuestionWallComment) {
    this.firstPassIntroduction = false;
    if (this.commentFocus === comment) {
      return;
    }
    this.commentFocus = null;
    setTimeout(() => {
      this.commentFocus = comment;
      if (!comment.old) {
        comment.old = true;
        this.unreadComments--;
      }
      this.getDOMCommentFocus().scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 1);
  }

  toggleFocusIncommingComments() {
    this.focusIncommingComments = !this.focusIncommingComments;
  }

  applyUserMap(user: number) {
    this.userSelection = false;
    this.filterUserByNumber(user);
  }

  openUserMap() {
    if (this.userSelection) {
      return;
    }
    this.userSelection = true;
    this.updateFiltering();
  }

  cancelUserMap() {
    this.userSelection = false;
    this.deactivateFilter();
  }

  leave() {
    const resolveUserRole: () => string = () => {
      switch (this.user ? this.user.role : -1) {
        case UserRole.PARTICIPANT:
          return 'participant';
        case UserRole.EDITING_MODERATOR:
          return 'moderator';
        case UserRole.EXECUTIVE_MODERATOR:
          return 'moderator';
        case UserRole.CREATOR:
          return 'creator';
        default:
          return 'participant';
      }
    };
    this.router.navigate(['/' + resolveUserRole() + '/room/' + this.room.shortId + '/comments']);
  }

  likeComment(comment: QuestionWallComment) {
    this.commentService.voteUp(comment.comment, this.user.id).subscribe();
  }

  dislikeComment(comment: QuestionWallComment) {
    this.commentService.voteDown(comment.comment, this.user.id).subscribe();
  }

  sortScore(reverse?: boolean) {
    this.listFilter.sortType = SortType.score;
    this.listFilter.sortReverse = !!reverse;
    this.updateFiltering();
  }

  sortTime(reverse?: boolean) {
    this.listFilter.sortType = SortType.time;
    this.listFilter.sortReverse = !!reverse;
    this.updateFiltering();
  }

  sortControversy(reverse?: boolean) {
    this.listFilter.sortType = SortType.controversy;
    this.listFilter.sortReverse = !!reverse;
    this.updateFiltering();
  }

  getCurrentCommentList() {
    if (this.hasFilter) {
      return this.commentsFilter;
    } else {
      return this.commentsFilteredByTime;
    }
  }

  filterFavorites() {
    this.filterIcon = 'grade';
    this.isSvgIcon = false;
    this.filterTitle = 'question-wall.filter-favorite';
    this.filterDesc = '';
    this.listFilter.filterCompare = null;
    this.listFilter.filterType = FilterType.favorite;
    this.updateFiltering();
  }

  filterUser(comment: QuestionWallComment) {
    this.filterUserByNumber(comment.comment.userNumber);
  }

  filterUserByNumber(user: number) {
    this.filterIcon = 'person_pin_circle';
    this.isSvgIcon = false;
    this.filterTitle = 'question-wall.filter-user';
    this.filterDesc = String(user);
    this.listFilter.filterCompare = user;
    this.listFilter.filterType = FilterType.userNumber;
    this.updateFiltering();
  }

  filterBookmark() {
    this.filterIcon = 'bookmark';
    this.isSvgIcon = false;
    this.filterTitle = 'question-wall.filter-bookmark';
    this.filterDesc = '';
    this.listFilter.filterCompare = null;
    this.listFilter.filterType = FilterType.bookmark;
    this.updateFiltering();
  }

  filterTag(tag: string) {
    this.filterIcon = 'comment_tag';
    this.isSvgIcon = true;
    this.filterTitle = '';
    this.filterDesc = tag;
    this.listFilter.filterCompare = tag;
    this.listFilter.filterType = FilterType.tag;
    this.updateFiltering();
  }

  deactivateFilter() {
    this.listFilter.filterType = null;
    this.listFilter.filterCompare = null;
    this.updateFiltering();
  }

  sliderChange(evt: MatSliderChange) {
    this.fontSize = evt.value;
  }

  updateFiltering() {
    if (!this.listFilter.isReady()) {
      return;
    }
    this.commentsFilteredByTime = this.listFilter.filterCommentWrapperByTime(this.comments, c => c.comment);
    this.listFilter.sortCommentWrapperBySortType(this.commentsFilteredByTime, c => c.comment);
    this.commentsFilter = this.listFilter.filterCommentWrapperByType(this.commentsFilteredByTime, c => c.comment);
    const currentComments = this.listFilter.filterType ? this.commentsFilter : this.commentsFilteredByTime;
    setTimeout(() => {
      if (currentComments.length <= 0) {
        this.commentFocus = null;
      } else {
        this.commentFocus = currentComments[0];
      }
    });
    const tempUserSet = new Set();
    currentComments.forEach((wallComment) => tempUserSet.add(wallComment.comment.userNumber));
    this.commentsCountQuestions = currentComments.length;
    this.commentsCountUsers = tempUserSet.size;
    this.animationTrigger = false;
    setTimeout(() => {
      this.animationTrigger = true;
    });
  }

  setTimePeriod(period: Period) {
    this.listFilter.period = period;
    this.updateFiltering();
  }

  get hasFilter() {
    return !!this.listFilter.filterType;
  }

  private refreshUserMap() {
    this.userMap.clear();
    this.comments.forEach(({ comment }) => {
      this.userMap.set(comment.userNumber, (this.userMap.get(comment.userNumber) || 0) + 1);
    });
    this.userList.length = 0;
    this.userMap.forEach((num, user) => {
      this.userList.push([num, user]);
    });
  }

}
