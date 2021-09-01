import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { Message } from '@stomp/stompjs';
import { MatDialog } from '@angular/material/dialog';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { User } from '../../../models/user';
import { Vote } from '../../../models/vote';
import { UserRole } from '../../../models/user-roles.enum';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { CorrectWrong } from '../../../models/correct-wrong.enum';
import { EventService } from '../../../services/util/event.service';
import { Router } from '@angular/router';
import { AppComponent } from '../../../app.component';
import { ModeratorsComponent } from '../../creator/_dialogs/moderators/moderators.component';
import { TagsComponent } from '../../creator/_dialogs/tags/tags.component';
import { DeleteCommentsComponent } from '../../creator/_dialogs/delete-comments/delete-comments.component';
import { Export } from '../../../models/export';
import { NotificationService } from '../../../services/util/notification.service';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { CommentFilter, Period } from '../../../utils/filter-options';


@Component({
  selector: 'app-moderator-comment-list',
  templateUrl: './moderator-comment-list.component.html',
  styleUrls: ['./moderator-comment-list.component.scss']
})
export class ModeratorCommentListComponent implements OnInit, OnDestroy {
  @ViewChild('searchBox') searchField: ElementRef;
  @Input() user: User;
  @Input() roomId: string;
  AppComponent = AppComponent;
  comments: Comment[] = [];
  commentsFilteredByTime: Comment[] = [];
  room: Room;
  hideCommentsList = false;
  filteredComments: Comment[];
  userRole: UserRole;
  deviceType: string;
  isSafari: string;
  isLoading = true;
  voteasc = 'voteasc';
  votedesc = 'votedesc';
  time = 'time';
  currentSort: string;
  read = 'read';
  unread = 'unread';
  favorite = 'favorite';
  correct = 'correct';
  wrong = 'wrong';
  ack = 'ack';
  bookmark = 'bookmark';
  userNumber = 'userNumber';
  currentFilter = '';
  commentVoteMap = new Map<string, Vote>();
  scroll = false;
  scrollExtended = false;
  searchInput = '';
  search = false;
  searchPlaceholder = '';
  periodsList = Object.values(Period);
  period: Period = Period.twoWeeks;
  fromNow: number;
  headerInterface = null;

  constructor(
    private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected langService: LanguageService,
    private wsCommentService: WsCommentService,
    protected roomService: RoomService,
    public eventService: EventService,
    private router: Router,
    private notificationService: NotificationService,
    private translationService: TranslateService,
    private bonusTokenService: BonusTokenService
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  initNavigation() {
    const navigation = {};
    const nav = (b, c) => navigation[b] = c;
    nav('moderator', () => {
      const dialogRef = this.dialog.open(ModeratorsComponent, {
        width: '400px'
      });
      dialogRef.componentInstance.roomId = this.room.id;
    });
    nav('tags', () => {
      const updRoom = JSON.parse(JSON.stringify(this.room));
      const dialogRef = this.dialog.open(TagsComponent, {
        width: '400px'
      });
      let tags = [];
      if (this.room.tags !== undefined) {
        tags = this.room.tags;
      }
      dialogRef.componentInstance.tags = tags;
      dialogRef.afterClosed()
      .subscribe(result => {
        if (!result || result === 'abort') {
          return;
        } else {
          updRoom.tags = result;
          this.roomService.updateRoom(updRoom)
          .subscribe((room) => {
              this.room = room;
              this.translateService.get('room-page.changes-successful').subscribe(msg => {
                this.notificationService.show(msg);
              });
            },
            error => {
              this.translateService.get('room-page.changes-gone-wrong').subscribe(msg => {
                this.notificationService.show(msg);
              });
            });
        }
      });
    });
    nav('deleteQuestions', () => {
      const dialogRef = this.dialog.open(DeleteCommentsComponent, {
        width: '400px'
      });
      dialogRef.componentInstance.roomId = this.roomId;
      dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.translationService.get('room-page.comments-deleted').subscribe(msg => {
            this.notificationService.show(msg);
          });
          this.commentService.deleteCommentsByRoomId(this.roomId).subscribe();
        }
      });
    });
    nav('exportQuestions', () => {
      const exp: Export = new Export(
        this.room,
        this.commentService,
        this.bonusTokenService,
        this.translationService,
        'comment-list',
        this.notificationService);
      exp.exportAsCsv();
    });
    this.headerInterface = this.eventService.on<string>('navigate').subscribe(e => {
      if (navigation.hasOwnProperty(e)) {
        navigation[e]();
      }
    });
  }

  ngOnDestroy() {
    if (this.headerInterface) {
      this.headerInterface.unsubscribe();
    }
  }

  ngOnInit() {
    this.initNavigation();
    this.roomId = localStorage.getItem(`roomId`);
    const userId = this.user.id;
    this.userRole = this.user.role;
    this.roomService.getRoom(this.roomId).subscribe(room => this.room = room);
    this.hideCommentsList = false;
    this.wsCommentService.getModeratorCommentStream(this.roomId).subscribe((message: Message) => {
      this.parseIncomingModeratorMessage(message);
    });
    this.wsCommentService.getCommentStream(this.roomId).subscribe((message: Message) => {
      this.parseIncomingMessage(message);
    });
    this.translateService.use(localStorage.getItem('currentLang'));
    this.deviceType = localStorage.getItem('deviceType');
    this.isSafari = localStorage.getItem('isSafari');
    this.currentSort = this.votedesc;
    this.commentService.getRejectedComments(this.roomId)
      .subscribe(comments => {
        this.comments = comments;
        this.setTimePeriod(this.period);
        this.isLoading = false;
      });
    this.translateService.get('comment-list.search').subscribe(msg => {
      this.searchPlaceholder = msg;
    });
  }

  private getCurrentFilter() {
    const filter = new CommentFilter();
    filter.filterSelected = this.currentFilter;
    filter.periodSet = this.period;

    if (filter.periodSet === Period.fromNow) {
      filter.timeStampNow = new Date().getTime();
    }

    CommentFilter.currentFilter = filter;
  }

  checkScroll(): void {
    const currentScroll = document.documentElement.scrollTop;
    this.scroll = currentScroll >= 65;
    this.scrollExtended = currentScroll >= 300;
  }

  isScrollButtonVisible(): boolean {
    return !AppComponent.isScrolledTop() && this.commentsFilteredByTime.length > 10;
  }

  searchComments(): void {
    this.search = true;
    if (this.searchInput && this.searchInput.length > 1) {
      this.hideCommentsList = true;
      this.filteredComments = this.comments
        .filter(c => this.checkIfIncludesKeyWord(c.body, this.searchInput)
          || (!!c.answer ? this.checkIfIncludesKeyWord(c.answer, this.searchInput) : false));
    }
  }

  checkIfIncludesKeyWord(body: string, keyword: string) {
    return body.toLowerCase().includes(keyword.toLowerCase());
  }

  activateSearch() {
    this.translateService.get('comment-list.search').subscribe(msg => {
      this.searchPlaceholder = msg;
    });
    this.search = true;
    this.searchField.nativeElement.focus();
  }

  getComments(): void {
    this.isLoading = false;
    let commentThreshold = -10;
    if (this.room.threshold !== null) {
      commentThreshold = this.room.threshold;
      if (this.hideCommentsList) {
        this.filteredComments = this.filteredComments.filter(x => x.score >= commentThreshold);
      } else {
        this.comments = this.comments.filter(x => x.score >= commentThreshold);
      }
    }
    this.setTimePeriod(this.period);
  }

  getVote(comment: Comment): Vote {
    if (this.userRole === 0) {
      return this.commentVoteMap.get(comment.id);
    }
  }

  parseIncomingMessage(message: Message) {
    const msg = JSON.parse(message.body);
    const payload = msg.payload;
    switch (msg.type) {
      case 'CommentPatched':
        // ToDo: Use a map for comments w/ key = commentId
        for (let i = 0; i < this.comments.length; i++) {
          if (payload.id === this.comments[i].id) {
            for (const [key, value] of Object.entries(payload.changes)) {
              if (key === this.ack) {
                const isNowAck = <boolean>value;
                if (isNowAck) {
                  this.comments = this.comments.filter(function (el) {
                    return el.id !== payload.id;
                  });
                  this.setTimePeriod(this.period);
                }
                switch (key) {
                  case this.read:
                    this.comments[i].read = <boolean>value;
                    break;
                  case this.correct:
                    this.comments[i].correct = <CorrectWrong>value;
                    break;
                  case this.favorite:
                    this.comments[i].favorite = <boolean>value;
                    break;
                  case this.bookmark:
                    this.comments[i].bookmark = <boolean>value;
                    break;
                  case 'score':
                    this.comments[i].score = <number>value;
                    break;
                  case this.ack:
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    const isNowAck = <boolean>value;
                    if (isNowAck) {
                      this.comments = this.comments.filter(function (el) {
                        return el.id !== payload.id;
                      });
                    }
                }
              }
            }
          }
        }
        break;
      case 'CommentDeleted':
        for (let i = 0; i < this.comments.length; i++) {
          this.comments = this.comments.filter(function (el) {
            return el.id !== payload.id;
          });
        }
        break;
    }
    this.setTimePeriod(this.period);
    if (this.hideCommentsList) {
      this.searchComments();
    }
  }

  parseIncomingModeratorMessage(message: Message) {
    const msg = JSON.parse(message.body);
    const payload = msg.payload;
    switch (msg.type) {
      case 'CommentCreated':
        const c = new Comment();
        c.roomId = this.roomId;
        c.body = payload.body;
        c.id = payload.id;
        c.timestamp = payload.timestamp;
        c.creatorId = payload.creatorId;
        c.keywordsFromQuestioner = payload.keywordsFromQuestioner ?
                                   JSON.parse(payload.keywordsFromQuestioner as unknown as string) : null;
        c.userNumber = this.commentService.hashCode(c.creatorId);
        this.comments = this.comments.concat(c);
        break;
    }
    this.setTimePeriod(this.period);
    if (this.hideCommentsList) {
      this.searchComments();
    }
  }

  filterComments(type: string, compare?: any): void {
    this.currentFilter = type;
    if (type === '') {
      this.filteredComments = this.commentsFilteredByTime;
      return;
    }
    this.filteredComments = this.commentsFilteredByTime.filter(c => {
      switch (type) {
        case this.correct:
          return c.correct === CorrectWrong.CORRECT ? 1 : 0;
        case this.wrong:
          return c.correct === CorrectWrong.WRONG ? 1 : 0;
        case this.favorite:
          return c.favorite;
        case this.bookmark:
          return c.bookmark;
        case this.read:
          return c.read;
        case this.unread:
          return !c.read;
        case this.userNumber:
          return c.userNumber === compare;
      }
    });
    this.hideCommentsList = true;
    this.sortComments(this.currentSort);
  }

  clickedUserNumber(usrNumber: number): void {
    this.filterComments(this.userNumber, usrNumber);
  }

  sort(array: any[], type: string): void {
    array.sort((a, b) => {
      if (type === this.voteasc) {
        return (a.score > b.score) ? 1 : (b.score > a.score) ? -1 : 0;
      } else if (type === this.votedesc) {
        return (b.score > a.score) ? 1 : (a.score > b.score) ? -1 : 0;
      }
      const dateA = new Date(a.timestamp), dateB = new Date(b.timestamp);
      if (type === this.time) {
        return (+dateB > +dateA) ? 1 : (+dateA > +dateB) ? -1 : 0;
      }
    });
  }

  sortComments(type: string): void {
    if (this.hideCommentsList === true) {
      this.sort(this.filteredComments, type);
    } else {
      this.sort(this.commentsFilteredByTime, type);
    }
    this.currentSort = type;
  }

  switchToCommentList(): void {
    let role;
    if (this.userRole === UserRole.CREATOR.valueOf()) {
      role = 'creator';
    } else if (this.userRole === UserRole.EXECUTIVE_MODERATOR) {
      role = 'moderator';
    }
    this.router.navigate([`/${role}/room/${this.room.shortId}/comments`]);
  }
  setTimePeriod(period?: Period) {
    if (period) {
      this.period = period;
      this.fromNow = null;
    }
    const currentTime = new Date();
    const hourInSeconds = 3600000;
    let periodInSeconds;
    if (this.period !== Period.all) {
      switch (this.period) {
        case Period.fromNow:
          if (!this.fromNow) {
            this.fromNow = new Date().getTime();
          }
          break;
        case Period.oneHour:
          periodInSeconds = hourInSeconds;
          break;
        case Period.threeHours:
          periodInSeconds = hourInSeconds * 2;
          break;
        case Period.oneDay:
          periodInSeconds = hourInSeconds * 24;
          break;
        case Period.oneWeek:
          periodInSeconds = hourInSeconds * 168;
          break;
        case Period.twoWeeks:
          periodInSeconds = hourInSeconds * 336;
          break;
      }
      this.commentsFilteredByTime = this.comments
        .filter(c => new Date(c.timestamp).getTime() >=
          (this.period === Period.fromNow ? this.fromNow : (currentTime.getTime() - periodInSeconds)));
    } else {
      this.commentsFilteredByTime = this.comments;
    }

    this.filterComments(this.currentFilter);
  }
}
