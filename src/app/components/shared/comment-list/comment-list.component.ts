import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { MatDialog } from '@angular/material/dialog';
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
import { Subscription } from 'rxjs';
import { AppComponent } from '../../../app.component';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { TitleService } from '../../../services/util/title.service';
import { ModeratorsComponent } from '../../creator/_dialogs/moderators/moderators.component';
import { TagsComponent } from '../../creator/_dialogs/tags/tags.component';
import { DeleteCommentsComponent } from '../../creator/_dialogs/delete-comments/delete-comments.component';
import { Export } from '../../../models/export';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { ModeratorService } from '../../../services/http/moderator.service';
import { CommentFilter, Period } from '../../../utils/filter-options';
import { CreateCommentWrapper } from '../../../utils/CreateCommentWrapper';
import { TopicCloudAdminService } from '../../../services/util/topic-cloud-admin.service';
import { RoomDataService } from '../../../services/util/room-data.service';
import { WsRoomService } from '../../../services/websockets/ws-room.service';

export interface CommentListData {
  comments: Comment[];
  currentFilter: CommentFilter;
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
  period: Period = Period.twoWeeks;
  fromNow: number;
  moderatorIds: string[];
  commentsEnabled: boolean;
  createCommentWrapper: CreateCommentWrapper = null;
  private _subscriptionEventServiceTagConfig = null;
  private _subscriptionEventServiceRoomData = null;
  private _subscriptionRoomService = null;

  constructor(
    private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected langService: LanguageService,
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
    private topicCloudAdminService: TopicCloudAdminService,
    private roomDataService: RoomDataService,
    private wsRoomService: WsRoomService
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  initNavigation() {
    this._subscriptionEventServiceTagConfig = this.eventService.on<string>('setTagConfig').subscribe(tag => {
      this.clickedOnKeyword(tag);
    });
    this._subscriptionEventServiceRoomData = this.eventService.on<string>('pushCurrentRoomData').subscribe(_ => {
      this.eventService.broadcast('currentRoomData', {
        currentFilter: this.getCurrentFilter(),
        comments: this.comments
      } as CommentListData);
    });
    const navigation = {};
    const nav = (b, c) => navigation[b] = c;
    nav('createQuestion', () => this.createCommentWrapper.openCreateDialog(this.user));
    nav('moderator', () => {
      const dialogRef = this.dialog.open(ModeratorsComponent, {
        width: '400px',
      });
      dialogRef.componentInstance.roomId = this.room.id;
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
      this.authenticationService.checkAccess(this.shortId);
      this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(r => {
        this.roomService.getRoomByShortId(this.shortId).subscribe(room => {
          this.room = room;
          this.roomId = room.id;
          this.moderationEnabled = this.room.moderated;
          this.directSend = this.room.directSend;
          this.commentsEnabled = (this.userRole > 0) || !this.room.questionsBlocked;
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

            this.roomDataService.getRoomData(this.room.id).subscribe(comments => {
              this.comments = comments;
              this.getComments();
              this.eventService.broadcast('commentListCreated', null);
            });
            this.subscribeCommentStream();
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
    this._subscriptionRoomService = this.wsRoomService.getRoomStream(this.roomId).subscribe(msg => {
      const message = JSON.parse(msg.body);
      if (message.type === 'RoomPatched') {
        this.room = message.payload.changes;
        this.roomId = this.room.id;
        this.moderationEnabled = this.room.moderated;
        this.directSend = this.room.directSend;
        this.commentsEnabled = (this.userRole > 0) || !this.room.questionsBlocked;
      }
    });
  }

  ngOnDestroy() {
    if (!this.freeze && this.commentStream) {
      this.commentStream.unsubscribe();
    }
    this._subscriptionRoomService.unsubscribe();
    this.titleService.resetTitle();
    if (this.headerInterface) {
      this.headerInterface.unsubscribe();
    }
    if (this._subscriptionEventServiceRoomData) {
      this._subscriptionEventServiceRoomData.unsubscribe();
    }
    if (this._subscriptionEventServiceTagConfig) {
      this._subscriptionEventServiceTagConfig.unsubscribe();
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

  closeDialog() {
    this.dialog.closeAll();
  }

  filterComments(type: string, compare?: any): void {
    this.currentFilter = type;
    if (type === '') {
      this.filteredComments = this.commentsFilteredByTime;
      this.hideCommentsList = false;
      this.currentFilter = '';
      this.selectedTag = '';
      this.selectedKeyword = '';
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
          return c.keywordsFromQuestioner ? c.keywordsFromQuestioner.includes(compare) : false;
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
    this.roomDataService.getRoomData(this.roomId, true)
      .subscribe(comments => {
        this.comments = comments;
        this.setComments(comments);
        this.getComments();
      });
    this.commentStream.unsubscribe();
    this.translateService.get('comment-list.comment-stream-stopped').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  playCommentStream() {
    this.freeze = false;
    this.roomDataService.getRoomData(this.roomId)
      .subscribe(comments => {
        this.comments = comments;
        this.setComments(comments);
        this.getComments();
      });
    this.subscribeCommentStream();
    this.translateService.get('comment-list.comment-stream-started').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  subscribeCommentStream() {
    this.commentStream = this.roomDataService.receiveUpdates([
      {type: 'CommentCreated', finished: true},
      {type: 'CommentPatched', subtype: this.favorite},
      {type: 'CommentPatched', subtype: 'score'},
      {finished: true}
    ]).subscribe(update => {
      if (update.type === 'CommentCreated') {
        this.announceNewComment(update.comment.body);
        this.setComments(this.comments);
      } else if (update.type === 'CommentPatched') {
        if (update.subtype === 'score') {
          this.getComments();
        } else if (update.subtype === this.favorite) {
          if (this.user.id === update.comment.creatorId && update.comment.favorite) {
            this.translateService.get('comment-list.comment-got-favorited').subscribe(ret => {
              this.notificationService.show(ret);
            });
          }
        }
      }
      if (update.finished) {
        this.setTimePeriod();
        if (this.hideCommentsList) {
          this.searchComments();
        }
      }
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

      this.liveAnnouncer.announce(newCommentText).catch(err => { /* TODO error handling */
      });
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
    this.titleService.attachTitle('(' + this.commentsFilteredByTime.length + ')');
  }

  private getCurrentFilter(): CommentFilter {
    const filter = new CommentFilter();
    filter.filterSelected = this.currentFilter;
    filter.paused = this.freeze;
    filter.periodSet = this.period;
    filter.keywordSelected = this.selectedKeyword;
    filter.tagSelected = this.selectedTag;

    if (filter.periodSet === Period.fromNow) {
      filter.timeStampNow = new Date().getTime();
    }

    return filter;
  }
}
