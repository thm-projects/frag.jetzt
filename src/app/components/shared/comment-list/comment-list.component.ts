import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { Message } from '@stomp/stompjs';
import { CreateCommentComponent } from '../_dialogs/create-comment/create-comment.component';
import { MatDialog } from '@angular/material/dialog';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { User } from '../../../models/user';
import { Vote } from '../../../models/vote';
import { UserRole } from '../../../models/user-roles.enum';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { VoteService } from '../../../services/http/vote.service';
import { NotificationService } from '../../../services/util/notification.service';
import { CorrectWrong } from '../../../models/correct-wrong.enum';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { Observable, Subscription } from 'rxjs';
import { AppComponent } from '../../../app.component';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { Title } from '@angular/platform-browser';
import { TitleService } from '../../../services/util/title.service';
import { ModeratorsComponent } from '../../creator/_dialogs/moderators/moderators.component';
import { TagsComponent } from '../../creator/_dialogs/tags/tags.component';
import { DeleteCommentsComponent } from '../../creator/_dialogs/delete-comments/delete-comments.component';
import { Export } from '../../../models/export';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { ModeratorService } from '../../../services/http/moderator.service';
import { TopicCloudFilterComponent } from '../_dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { CommentFilterOptions } from '../../../utils/filter-options';
import { isObjectBindingPattern } from 'typescript';
import { CreateCommentWrapper } from '../../../utils/CreateCommentWrapper';

export enum Period {
  FROMNOW    = 'from-now',
  ONEHOUR    = 'time-1h',
  THREEHOURS = 'time-3h',
  ONEDAY     = 'time-1d',
  ONEWEEK    = 'time-1w',
  TWOWEEKS   = 'time-2w',
  ALL        = 'time-all'
}

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
})

export class CommentListComponent implements OnInit, OnDestroy {
  @ViewChild('searchBox') searchField: ElementRef;
  @Input() user: User;
  @Input() roomId: string;
  shortId: string;
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
  moderator = 'moderator';
  lecturer = 'lecturer';
  tag = 'tag';
  selectedTag = '';
  userNumber = 'userNumber';
  keyword = 'keyword';
  selectedKeyword = '';
  answer = 'answer';
  unanswered = 'unanswered';
  owner = 'owner';
  currentFilter = '';
  commentVoteMap = new Map<string, Vote>();
  scroll = false;
  scrollExtended = false;
  searchInput = '';
  search = false;
  searchPlaceholder = '';
  moderationEnabled = true;
  directSend = true;
  thresholdEnabled = false;
  newestComment: string;
  freeze = false;
  commentStream: Subscription;
  periodsList = Object.values(Period);
  headerInterface = null;
  period: Period = Period.TWOWEEKS;
  fromNow: number;
  moderatorIds: string[];
  commentsEnabled: boolean;
  createCommentWrapper: CreateCommentWrapper = null;

  constructor(
    private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected langService: LanguageService,
    private wsCommentService: WsCommentServiceService,
    protected roomService: RoomService,
    protected voteService: VoteService,
    private authenticationService: AuthenticationService,
    private notificationService: NotificationService,
    public eventService: EventService,
    public liveAnnouncer: LiveAnnouncer,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: TitleService,
    private translationService: TranslateService,
    private bonusTokenService: BonusTokenService,
    private moderatorService: ModeratorService,
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  initNavigation() {
    const navigation = {};
    const nav = (b, c) => navigation[b] = c;
    nav('createQuestion', () => this.createCommentWrapper.openCreateDialog(this.user));
    nav('moderator', () => {
      const dialogRef = this.dialog.open(ModeratorsComponent, {
        width: '400px',
      });
      dialogRef.componentInstance.roomId = this.room.id;
    });
    this.eventService.on<string>('setTagConfig').subscribe(tag => {
      this.clickedOnTag(tag);
    });
    nav('tags', () => {
      const updRoom = JSON.parse(JSON.stringify(this.room));
      const dialogRef = this.dialog.open(TagsComponent, {
        width: '400px',
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
        width: '400px',
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

  ngOnInit() {
    this.initNavigation();
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
        if (this.userRole === 0) {
          this.voteService.getByRoomIdAndUserID(this.roomId, this.user.id).subscribe(votes => {
            for (const v of votes) {
              this.commentVoteMap.set(v.commentId, v);
            }
          });
        }
      }
    });
    this.userRole = this.route.snapshot.data.roles[0];
    this.route.params.subscribe(params => {
      this.shortId = params['shortId'];
      this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(r => {
        this.roomService.getRoomByShortId(this.shortId).subscribe(room => {
          this.room = room;
          this.roomId = room.id;
          this.moderationEnabled = this.room.moderated;
          this.directSend = this.room.directSend;
          this.commentsEnabled = (this.userRole > 0) || !this.room.closed;
          this.createCommentWrapper = new CreateCommentWrapper(this.translateService,
            this.notificationService, this.commentService, this.dialog, this.room);
          localStorage.setItem('moderationEnabled', JSON.stringify(this.moderationEnabled));
          if (!this.authenticationService.hasAccess(this.shortId, UserRole.PARTICIPANT)) {
            this.roomService.addToHistory(this.room.id);
            this.authenticationService.setAccess(this.shortId, UserRole.PARTICIPANT);
          }
          this.moderatorService.get(this.roomId).subscribe(list => {
            this.moderatorIds = list.map(m => m.accountId);
            this.moderatorIds.push(this.room.ownerId);

            this.subscribeCommentStream();
            this.commentService.getAckComments(this.room.id)
              .subscribe(comments => {
                this.comments = comments;
                this.getComments();
                this.eventService.broadcast('commentListCreated', null);
              });
          });
          /**
           if (this.userRole === UserRole.PARTICIPANT) {
            this.openCreateDialog();
          }
           */
        });
      });
    });
    this.currentSort = this.votedesc;
    this.hideCommentsList = false;
    this.translateService.use(localStorage.getItem('currentLang'));
    this.deviceType = localStorage.getItem('deviceType');
    this.isSafari = localStorage.getItem('isSafari');
    this.translateService.get('comment-list.search').subscribe(msg => {
      this.searchPlaceholder = msg;
    });

    this.getCurrentFilter().writeFilter();
  }

  private getCurrentFilter(): CommentFilterOptions {
    const filter = new CommentFilterOptions();
    filter.filterSelected = this.currentFilter;
    filter.paused = this.freeze;
    filter.periodSet = this.period;
    filter.keywordSelected = this.selectedKeyword;
    filter.tagSelected = this.selectedTag;

    if (filter.periodSet == Period.FROMNOW) {
      filter.timeStampNow = new Date().getTime();
    }

    return filter;
  }

  ngOnDestroy() {
    if (!this.freeze && this.commentStream) {
      this.commentStream.unsubscribe();
    }
    this.titleService.resetTitle();
    if (this.headerInterface) {
      this.headerInterface.unsubscribe();
    }
  }

  checkScroll(): void {
    const currentScroll = document.documentElement.scrollTop;
    this.scroll = currentScroll >= 65;
    this.scrollExtended = currentScroll >= 300;
  }

  isScrollButtonVisible(): boolean {
    return !AppComponent.isScrolledTop() && this.comments.length > 10;
  }

  searchComments(): void {
    this.search = true;
    if (this.searchInput) {
      if (this.searchInput.length > 1) {
        this.hideCommentsList = true;
        this.filteredComments = this.comments
          .filter(c => this.checkIfIncludesKeyWord(c.body, this.searchInput)
                       || (!!c.answer ? this.checkIfIncludesKeyWord(c.answer, this.searchInput) : false));
      }
    } else if (this.searchInput.length === 0 && this.currentFilter === '') {
      this.hideCommentsList = false;
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
    if (this.room.threshold) {
      this.thresholdEnabled = true;
    } else {
      this.thresholdEnabled = false;
    }
    this.isLoading = false;
    let commentThreshold;
    if (this.thresholdEnabled) {
      commentThreshold = this.room.threshold;
      if (this.hideCommentsList) {
        this.filteredComments = this.filteredComments.filter(x => x.score >= commentThreshold);
      } else {
        this.setComments(this.comments.filter(x => x.score >= commentThreshold));
      }
    }
    this.setTimePeriod();
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
      case 'CommentCreated':
        const c = new Comment();
        c.roomId = this.roomId;
        c.body = payload.body;
        c.id = payload.id;
        c.timestamp = payload.timestamp;
        c.tag = payload.tag;
        c.creatorId = payload.creatorId;
        c.userNumber = this.commentService.hashCode(c.creatorId);
        this.commentService.getComment(c.id).subscribe(e => {
          c.number = e.number;
        });

        this.announceNewComment(c.body);
        this.comments = this.comments.concat(c);
        this.setComments(this.comments);
        break;
      case 'CommentPatched':
        // ToDo: Use a map for comments w/ key = commentId
        for (let i = 0; i < this.comments.length; i++) {
          if (payload.id === this.comments[i].id) {
            for (const [key, value] of Object.entries(payload.changes)) {
              switch (key) {
                case this.read:
                  this.comments[i].read = <boolean>value;
                  break;
                case this.correct:
                  this.comments[i].correct = <CorrectWrong>value;
                  break;
                case this.favorite:
                  this.comments[i].favorite = <boolean>value;
                  if (this.user.id === this.comments[i].creatorId && <boolean>value) {
                    this.translateService.get('comment-list.comment-got-favorited').subscribe(ret => {
                      this.notificationService.show(ret);
                    });
                  }
                  break;
                case this.bookmark:
                  this.comments[i].bookmark = <boolean>value;
                  break;
                case 'score':
                  this.comments[i].score = <number>value;
                  this.getComments();
                  break;
                case this.ack:
                  const isNowAck = <boolean>value;
                  if (!isNowAck) {
                    this.comments = this.comments.filter((el) => {
                      return el.id !== payload.id;
                    });
                    this.setTimePeriod();
                  }
                  break;
                case this.tag:
                  this.comments[i].tag = <string>value;
                  break;
                case this.answer:
                  this.comments[i].answer = <string>value;
                  break;
              }
            }
          }
        }
        break;
      case 'CommentHighlighted':
        // ToDo: Use a map for comments w/ key = commentId
        for (let i = 0; i < this.comments.length; i++) {
          if (payload.id === this.comments[i].id) {
            this.comments[i].highlighted = <boolean>payload.lights;
          }
        }
        break;
      case 'CommentDeleted':
        for (let i = 0; i < this.comments.length; i++) {
          this.comments = this.comments.filter((el) => {
            return el.id !== payload.id;
          });
        }
        break;
    }
    this.setTimePeriod();
    if (this.hideCommentsList) {
      this.searchComments();
    }
  }
  closeDialog() {
    this.dialog.closeAll();
  }

  filterComments(type: string, compare?: any): void {
    this.currentFilter = type;
    if (type === '') {
      this.filteredComments = this.commentsFilteredByTime;
      this.hideCommentsList = false;
      this.currentFilter = '';
      this.sortComments(this.currentSort);
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
        case this.tag:
          this.selectedTag = compare;
          return c.tag === compare;
        case this.userNumber:
          return c.userNumber === compare;
        case this.keyword:
          this.selectedKeyword = compare;
          return c.keywordsFromQuestioner != null && c.keywordsFromQuestioner.length > 0 ? c.keywordsFromQuestioner.includes(compare) : false;
        case this.answer:
          return c.answer;
        case this.unanswered:
          return !c.answer;
        case this.owner:
          return c.creatorId === this.user.id;
        case this.moderator:
          return c.creatorId === this.user.id && (this.user.role === 2 || this.user.role === 1);
        case this.lecturer:
          return c.creatorId === this.user.id && this.user.role === 3;
      }
    });
    this.hideCommentsList = true;
    this.sortComments(this.currentSort);

    CommentFilterOptions.writeFilterStatic(this.getCurrentFilter());
  }

  sort(array: any[], type: string): any[] {
    const sortedArray = array.sort((a, b) => {
      if (type === this.voteasc) {
        return (a.score > b.score) ? 1 : (b.score > a.score) ? -1 : 0;
      } else if (type === this.votedesc) {
        return (b.score > a.score) ? 1 : (a.score > b.score) ? -1 : 0;
      } else if (type === this.time) {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return (+dateB > +dateA) ? 1 : (+dateA > +dateB) ? -1 : 0;
      }
    });
    return sortedArray.sort((a, b) => this.isCreatedByModeratorOrCreator(a) ? -1 : this.isCreatedByModeratorOrCreator(b) ? 1 : 0);
  }

  isCreatedByModeratorOrCreator(comment: Comment): boolean {
    return this.moderatorIds.indexOf(comment.creatorId) > -1;
  }

  sortComments(type: string): void {
    if (this.hideCommentsList === true) {
      this.filteredComments = this.sort(this.filteredComments, type);
    } else {
      this.setComments(this.sort(this.commentsFilteredByTime, type));
    }
    this.currentSort = type;
  }

  clickedOnTag(tag: string): void {
    this.filterComments(this.tag, tag);
  }

  clickedOnKeyword(keyword: string): void {
    this.filterComments(this.keyword, keyword);
  }

  clickedUserNumber(usrNumber: number): void {
    this.filterComments(this.userNumber, usrNumber);
  }

  pauseCommentStream() {
    this.freeze = true;
    this.commentStream.unsubscribe();
    this.translateService.get('comment-list.comment-stream-stopped').subscribe(msg => {
      this.notificationService.show(msg);
    });

    let filter = CommentFilterOptions.generateFilterUntil(this.currentFilter, this.period, new Date().getTime(), this.selectedTag, this.selectedKeyword);
    filter.writeFilter();
  }

  playCommentStream() {
    this.freeze = false;
    this.commentService.getAckComments(this.roomId)
      .subscribe(comments => {
        this.comments = comments;
        this.setComments(comments);
        this.getComments();
      });
    this.subscribeCommentStream();
    this.translateService.get('comment-list.comment-stream-started').subscribe(msg => {
      this.notificationService.show(msg);
    });

    const filter = this.getCurrentFilter();
    filter.writeFilter();
  }

  subscribeCommentStream() {
    this.commentStream = this.wsCommentService.getCommentStream(this.room.id).subscribe((message: Message) => {
      this.parseIncomingMessage(message);
    });
  }

  switchToModerationList(): void {
    this.router.navigate([`/moderator/room/${this.room.shortId}/moderator/comments`]);
  }

  setComments(comments: Comment[]) {
    this.commentsFilteredByTime = comments;
    this.titleService.attachTitle('(' + this.commentsFilteredByTime.length + ')');
  }

  /**
   * Announces a new comment receive.
   */
  public announceNewComment(comment: string) {
    // update variable so text will be fetched to DOM
    this.newestComment = comment;

    // Currently the only possible way to announce the new comment text
    // @see https://github.com/angular/angular/issues/11405
    setTimeout(() => {
      const newCommentText: string = document.getElementById('new-comment').innerText;

      // current live announcer content must be cleared before next read
      this.liveAnnouncer.clear();

      this.liveAnnouncer.announce(newCommentText).catch(err => { /* TODO error handling */ });
    }, 450);
  }

  public setTimePeriod(period?: Period) {
    if (period) {
      this.period = period;
      this.fromNow = null;
    }
    const currentTime = new Date();
    const hourInSeconds = 3600000;
    let periodInSeconds;
    if (this.period !== Period.ALL) {
      switch (this.period) {
        case Period.FROMNOW:
          if (!this.fromNow) {
            this.fromNow = new Date().getTime();
          }
          break;
        case Period.ONEHOUR:
          periodInSeconds = hourInSeconds;
          break;
        case Period.THREEHOURS:
          periodInSeconds = hourInSeconds * 2;
          break;
        case Period.ONEDAY:
          periodInSeconds = hourInSeconds * 24;
          break;
        case Period.ONEWEEK:
          periodInSeconds = hourInSeconds * 168;
          break;
        case Period.TWOWEEKS:
          periodInSeconds = hourInSeconds * 336;
          break;
      }
      this.commentsFilteredByTime = this.comments
        .filter(c => new Date(c.timestamp).getTime() >=
                     (this.period === Period.FROMNOW ? this.fromNow : (currentTime.getTime() - periodInSeconds)));
    } else {
      this.commentsFilteredByTime = this.comments;
    }

    this.getCurrentFilter().writeFilter();

    this.filterComments(this.currentFilter);
    this.titleService.attachTitle('(' + this.commentsFilteredByTime.length + ')');
  }
}
