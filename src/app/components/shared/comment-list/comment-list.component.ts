import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EventService } from '../../../services/util/event.service';
import { Subscription } from 'rxjs';
import { AppComponent } from '../../../app.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { TitleService } from '../../../services/util/title.service';
import { ModeratorsComponent } from '../../creator/_dialogs/moderators/moderators.component';
import { TagsComponent } from '../../creator/_dialogs/tags/tags.component';
import { DeleteCommentsComponent } from '../../creator/_dialogs/delete-comments/delete-comments.component';
import { Export } from '../../../models/export';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { ModeratorService } from '../../../services/http/moderator.service';
import { CreateCommentWrapper } from '../../../utils/create-comment-wrapper';
import { TopicCloudAdminService } from '../../../services/util/topic-cloud-admin.service';
import { RoomDataService } from '../../../services/util/room-data.service';
import { WsRoomService } from '../../../services/websockets/ws-room.service';
import { ActiveUserService } from '../../../services/http/active-user.service';
import { OnboardingService } from '../../../services/util/onboarding.service';
import { WorkerDialogComponent } from '../_dialogs/worker-dialog/worker-dialog.component';
import { PageEvent } from '@angular/material/paginator';
import { CommentListFilter, FilterType, FilterTypeKey, Period, SortType, SortTypeKey } from './comment-list.filter';
import { ViewCommentDataComponent } from '../view-comment-data/view-comment-data.component';

export interface CommentListData {
  currentFilter: CommentListFilter;
  room: Room;
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
  commentVoteMap = new Map<string, Vote>();
  scroll = false;
  scrollExtended = false;
  search = false;
  searchPlaceholder = '';
  moderationEnabled = true;
  directSend = true;
  newestComment: string;
  freeze = false;
  commentStream: Subscription;
  periodsList = Object.values(Period);
  headerInterface = null;
  commentsEnabled: boolean;
  createCommentWrapper: CreateCommentWrapper = null;
  isJoyrideActive = false;
  focusCommentId = '';
  sendCommentId = '';
  activeUsers = 0;
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];
  showFirstLastButtons = true;
  commentsWrittenByUsers: Map<string, Set<string>> = new Map<string, Set<string>>();
  filter: CommentListFilter;
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
    private wsRoomService: WsRoomService,
    private activeUserService: ActiveUserService,
    private onboardingService: OnboardingService
  ) {
    langService.langEmitter.subscribe(lang => {
      translateService.use(lang);
      this.translateService.get('comment-list.search').subscribe(msg => {
        this.searchPlaceholder = msg;
      });
    });
    this.filter = CommentListFilter.loadFilter();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

  initNavigation() {
    this._subscriptionEventServiceTagConfig = this.eventService.on<string>('setTagConfig').subscribe(tag => {
      this.setTimePeriod(Period.all);
      this.applyFilterByKey('keyword', tag);
    });
    this._subscriptionEventServiceRoomData = this.eventService.on<string>('pushCurrentRoomData').subscribe(_ => {
      this.eventService.broadcast('currentRoomData', {
        currentFilter: this.filter,
        room: this.room
      } as CommentListData);
    });
    const navigation = {};
    const nav = (b, c) => navigation[b] = c;
    nav('createQuestion', () => this.writeComment());
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
        this.notificationService,
        this.filter.moderatorAccountIds,
        this.user);
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
    const data = localStorage.getItem('commentListPageSize');
    this.pageSize = data ? +data || this.pageSize : this.pageSize;
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
        this.filter.updateUserId(this.user.id);
        if (this.userRole === UserRole.PARTICIPANT) {
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
          this.receiveRoom(room);
          this._subscriptionRoomService = this.wsRoomService.getRoomStream(this.roomId).subscribe(msg => {
            const message = JSON.parse(msg.body);
            if (message.type === 'RoomPatched') {
              this.receiveRoom(message.payload.changes);
            }
          });
          this.createCommentWrapper = new CreateCommentWrapper(this.translateService,
            this.notificationService, this.commentService, this.dialog, this.room);
          localStorage.setItem('moderationEnabled', JSON.stringify(this.moderationEnabled));
          if (!this.authenticationService.hasAccess(this.shortId, UserRole.PARTICIPANT)) {
            this.roomService.addToHistory(this.room.id);
            this.authenticationService.setAccess(this.shortId, UserRole.PARTICIPANT);
          }
          this.moderatorService.get(this.roomId).subscribe(list => {
            this.filter.updateModerators(list.map(m => m.accountId));

            this.roomDataService.getRoomData(this.room.id).subscribe(comments => {
              if (comments === null) {
                return;
              }
              this.comments = comments;
              this.generateKeywordsIfEmpty();
              if (this.filter.currentSearch) {
                this.search = true;
                this.hideCommentsList = true;
              }
              this.refreshFiltering();
              this.setFocusedComment(localStorage.getItem('answeringQuestion'));
              this.eventService.broadcast('commentListCreated', null);
              this.isJoyrideActive = this.onboardingService.startDefaultTour();
            });
            this.subscribeCommentStream();
          });
        });
      });
    });
    this.hideCommentsList = false;
    this.translateService.use(localStorage.getItem('currentLang'));
    this.deviceType = localStorage.getItem('deviceType');
    this.isSafari = localStorage.getItem('isSafari');
    this.translateService.get('comment-list.search').subscribe(msg => {
      this.searchPlaceholder = msg;
    });
  }

  ngOnDestroy() {
    this.filter.save();
    if (!this.freeze && this.commentStream) {
      this.commentStream.unsubscribe();
    }
    if (this._subscriptionRoomService) {
      this._subscriptionRoomService.unsubscribe();
    }
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
    localStorage.setItem('commentListPageSize', String(this.pageSize));
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
    if (this.filter.currentSearch) {
      this.hideCommentsList = true;
      this.filteredComments = this.filter.filterCommentsBySearch(this.comments);
    } else if (!this.filter.filterType) {
      this.hideCommentsList = false;
    }
  }

  activateSearch() {
    this.search = true;
    this.searchField.nativeElement.focus();
  }

  abortSearch() {
    this.hideCommentsList = false;
    this.filter.currentSearch = '';
    this.search = false;
    this.refreshFiltering();
  }

  refreshFiltering(): void {
    this.commentsWrittenByUsers.clear();
    for (const comment of this.comments) {
      let set = this.commentsWrittenByUsers.get(comment.creatorId);
      if (!set) {
        set = new Set<string>();
        this.commentsWrittenByUsers.set(comment.creatorId, set);
      }
      set.add(comment.id);
    }
    this.isLoading = false;
    this.commentsFilteredByTime = this.filter.filterCommentsByTime(this.comments);
    this.titleService.attachTitle('(' + this.commentsFilteredByTime.length + ')');
    if (this.search) {
      this.filteredComments = this.filter.filterCommentsBySearch(this.comments);
      return;
    }
    this.hideCommentsList = !!this.filter.filterType;
    this.filteredComments = this.hideCommentsList ?
      this.filter.filterCommentsByType(this.commentsFilteredByTime) : this.commentsFilteredByTime;
    this.filter.sortCommentsBySortType(this.filteredComments);
  }

  getVote(comment: Comment): Vote {
    if (this.userRole === 0) {
      return this.commentVoteMap.get(comment.id);
    }
  }

  closeDialog() {
    this.dialog.closeAll();
  }

  applyFilterByKey(type: FilterTypeKey, compare?: any): void {
    this.pageIndex = 0;
    this.filter.filterType = FilterType[type];
    this.filter.filterCompare = compare;
    this.refreshFiltering();
  }

  applySortingByKey(type: SortTypeKey) {
    this.filter.sortType = SortType[type];
    this.refreshFiltering();
  }

  votedComment(voteInfo: string) {
    setTimeout(() => this.setFocusedComment(voteInfo), 100);
  }

  activateCommentStream(freezed: boolean) {
    this.freeze = freezed;
    this.filter.freezedAt = freezed ? new Date().getTime() : null;
    this.roomDataService.getRoomData(this.roomId, freezed).subscribe(comments => {
      if (comments === null) {
        return;
      }
      this.comments = comments;
      this.refreshFiltering();
    });
    let message: string;
    if (freezed) {
      this.commentStream?.unsubscribe();
      message = 'comment-list.comment-stream-stopped';
    } else {
      this.subscribeCommentStream();
      message = 'comment-list.comment-stream-started';
    }
    this.translateService.get(message).subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  subscribeCommentStream() {
    let wasUpdate = false;
    this.commentStream = this.roomDataService.receiveUpdates([
      { type: 'CommentCreated', finished: true },
      { type: 'CommentPatched', subtype: 'favorite' },
      { finished: true }
    ]).subscribe(update => {
      if (update.type === 'CommentCreated') {
        this.announceNewComment(update.comment.body);
        if (update.comment.id && update.comment.id === this.sendCommentId) {
          wasUpdate = true;
        }
      } else if (update.type === 'CommentPatched') {
        if (update.subtype === 'favorite') {
          if (this.user.id === update.comment.creatorId && update.comment.favorite) {
            this.translateService.get('comment-list.comment-got-favorited').subscribe(ret => {
              this.notificationService.show(ret);
            });
          }
        }
      }
      if (update.finished) {
        this.refreshFiltering();
        if (wasUpdate) {
          this.setFocusedComment(this.sendCommentId);
          this.sendCommentId = null;
        }
      }
    });
  }

  switchToModerationList(): void {
    this.router.navigate([`/moderator/room/${this.room.shortId}/moderator/comments`]);
  }

  writeComment() {
    this.createCommentWrapper.openCreateDialog(this.user, this.userRole)
        .subscribe(comment => this.sendCommentId = comment?.id);
  }

  /**
   * Announces a new comment receive.
   */
  public announceNewComment(comment: string) {
    // update variable so text will be fetched to DOM
    this.newestComment = ViewCommentDataComponent.getTextFromData(comment);

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

  setTimePeriod(period?: Period) {
    if (period) {
      this.filter.period = period;
      this.filter.fromNow = null;
    }
    this.refreshFiltering();
  }

  getComments(): Comment[] {
    return this.hideCommentsList ? this.filteredComments : this.commentsFilteredByTime;
  }

  private receiveRoom(room: Room) {
    this.room = room;
    this.filter.updateRoom(room);
    this.roomId = room.id;
    this.moderationEnabled = room.moderated;
    this.directSend = room.directSend;
    this.commentsEnabled = (this.userRole > UserRole.PARTICIPANT) || !room.questionsBlocked;
  }

  private generateKeywordsIfEmpty() {
    if (this.comments.length > 0 && this.userRole === UserRole.CREATOR) {
      const count = this.comments.reduce((acc, comment) =>
        acc + (comment.keywordsFromQuestioner && comment.keywordsFromQuestioner.length) +
        (comment.keywordsFromSpacy && comment.keywordsFromSpacy.length), 0);
      if (count < 1) {
        WorkerDialogComponent.addWorkTask(this.dialog, this.room);
      }
    }
  }

  private setFocusedComment(commentId: string) {
    this.focusCommentId = null;
    if (!commentId) {
      return;
    }
    const index = this.getComments().findIndex(e => e.id === commentId);
    if (index < 0) {
      return;
    }
    this.pageIndex = Math.floor(index / this.pageSize);
    setTimeout(() => this.focusCommentId = commentId, 100);
  }
}
