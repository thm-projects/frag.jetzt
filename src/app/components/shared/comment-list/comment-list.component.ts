import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { TitleService } from '../../../services/util/title.service';
import { ModeratorsComponent } from '../../creator/_dialogs/moderators/moderators.component';
import { TagsComponent } from '../../creator/_dialogs/tags/tags.component';
import { DeleteCommentsComponent } from '../../creator/_dialogs/delete-comments/delete-comments.component';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { CreateCommentWrapper } from '../../../utils/create-comment-wrapper';
import { RoomDataService } from '../../../services/util/room-data.service';
import { OnboardingService } from '../../../services/util/onboarding.service';
import { PageEvent } from '@angular/material/paginator';
import { ViewCommentDataComponent } from '../view-comment-data/view-comment-data.component';
import { TopicCloudFilterComponent } from '../_dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { FormControl } from '@angular/forms';
import { copyCSVString, exportRoom } from '../../../utils/ImportExportMethods';
import { BrainstormingService } from '../../../services/http/brainstorming.service';
import { SessionService } from '../../../services/util/session.service';
import { RoomDataFilterService } from '../../../services/util/room-data-filter.service';
import {
  FilterType,
  FilterTypeKey,
  Period,
  RoomDataFilter,
  SortType,
  SortTypeKey
} from '../../../services/util/room-data-filter';
import { DeviceInfoService } from '../../../services/util/device-info.service';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
})
export class CommentListComponent implements OnInit, OnDestroy {
  @ViewChild('searchBox') searchField: ElementRef;
  @ViewChild('filterMenuTrigger') filterMenuTrigger: MatMenuTrigger;
  user: User;
  AppComponent = AppComponent;
  comments: Comment[] = [];
  commentsFilteredByTimeLength: number;
  room: Room;
  userRole: UserRole;
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
  pageSize = 25;
  pageSizeOptions = [25, 50, 100, 200];
  showFirstLastButtons = true;
  commentsWrittenByUsers: Map<string, Set<string>> = new Map<string, Set<string>>();
  questionNumberFormControl = new FormControl();
  questionNumberOptions: string[] = [];
  searchString: string;
  filterType: FilterType;
  sortType: SortType;
  sortReverse: boolean;
  period: Period;
  moderatorAccountIds: Set<string>;
  private firstReceive = true;
  private _allQuestionNumberOptions: string[] = [];
  private _subscriptionComments = null;

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
    private router: Router,
    private titleService: TitleService,
    private bonusTokenService: BonusTokenService,
    private roomDataService: RoomDataService,
    private roomDataFilterService: RoomDataFilterService,
    private onboardingService: OnboardingService,
    private brainstormingService: BrainstormingService,
    private sessionService: SessionService,
    public deviceInfo: DeviceInfoService,
  ) {
    langService.getLanguage().subscribe(lang => {
      translateService.use(lang);
      this.translateService.get('comment-list.search').subscribe(msg => {
        this.searchPlaceholder = msg;
      });
    });
    this.questionNumberFormControl.valueChanges.subscribe((v) => {
      v = v || '';
      this.questionNumberOptions = this._allQuestionNumberOptions.filter(e => e.startsWith(v));
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

  initNavigation() {
    const navigation = {};
    const nav = (b, c) => navigation[b] = c;
    nav('createQuestion', () => this.writeComment());
    nav('moderator', () => {
      const dialogRef = this.dialog.open(ModeratorsComponent, {
        width: '400px',
      });
      dialogRef.componentInstance.roomId = this.sessionService.currentRoom.id;
      dialogRef.componentInstance.isCreator = this.sessionService.currentRole === 3;
    });
    nav('tags', () => {
      const room = this.sessionService.currentRoom;
      const updRoom = JSON.parse(JSON.stringify(room));
      const dialogRef = this.dialog.open(TagsComponent, {
        width: '400px',
      });
      dialogRef.componentInstance.tags = room.tags || [];
      dialogRef.afterClosed()
        .subscribe(result => {
          if (!result || result === 'abort') {
            return;
          } else {
            updRoom.tags = result;
            this.roomService.updateRoom(updRoom)
              .subscribe((_room) => {
                  this.sessionService.updateCurrentRoom(_room);
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
      dialogRef.componentInstance.roomId = this.sessionService.currentRoom.id;
      dialogRef.afterClosed()
        .subscribe(result => {
          if (result === 'delete') {
            this.translateService.get('room-page.comments-deleted').subscribe(msg => {
              this.notificationService.show(msg);
            });
            this.commentService.deleteCommentsByRoomId(this.sessionService.currentRoom.id).subscribe();
          }
        });
    });
    nav('exportQuestions', () => {
      const room = this.sessionService.currentRoom;
      exportRoom(this.translateService,
        this.notificationService,
        this.bonusTokenService,
        this.commentService,
        'room-export',
        this.user,
        room,
        new Set<string>(this.moderatorAccountIds)
      ).subscribe(text => {
        copyCSVString(text[0], room.name + '-' + room.shortId + '-' + text[1] + '.csv');
      });
    });
    this.headerInterface = this.eventService.on<string>('navigate').subscribe(e => {
      if (navigation.hasOwnProperty(e)) {
        navigation[e]();
      }
    });
  }

  ngOnInit() {
    this.roomDataFilterService.currentFilter = RoomDataFilter.loadFilter('commentList');
    this.initNavigation();
    const data = localStorage.getItem('commentListPageSize');
    this.pageSize = data ? +data || this.pageSize : this.pageSize;
    this.authenticationService.watchUser.subscribe(newUser => {
      if (!newUser) {
        return;
      }
      this.user = newUser;
      if (this.sessionService.currentRole !== UserRole.PARTICIPANT) {
        return;
      }
      this.voteService.getByRoomIdAndUserID(this.sessionService.currentRoom.id, this.user.id).subscribe(votes => {
        for (const v of votes) {
          this.commentVoteMap.set(v.commentId, v);
        }
      });
    });
    this.userRole = this.sessionService.currentRole;
    this.sessionService.getRoomOnce().subscribe(room => {
      this.sessionService.getModeratorsOnce().subscribe(mods => {
        this.moderatorAccountIds = new Set<string>(mods.map(m => m.accountId));
      });
      this.receiveRoom(room);
      this.sessionService.receiveRoomUpdates().subscribe(_room => this.receiveRoom(_room));
      this.createCommentWrapper = new CreateCommentWrapper(this.translateService,
        this.notificationService, this.commentService, this.dialog, this.sessionService.currentRoom);
      this.roomDataService.getRoomDataOnce().subscribe(comments => {
        this.generateKeywordsIfEmpty(comments);
        this._subscriptionComments = this.roomDataFilterService.getData()
          .subscribe(c => this.onRefreshFiltering());
      });
      this.subscribeCommentStream();
    });
    this.translateService.get('comment-list.search').subscribe(msg => {
      this.searchPlaceholder = msg;
    });
  }

  ngOnDestroy() {
    this.roomDataFilterService.currentFilter.save('commentList');
    this.commentStream?.unsubscribe();
    this._subscriptionComments?.unsubscribe();
    this.titleService.resetTitle();
    this.headerInterface?.unsubscribe();
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
    if (!this.searchString) {
      return;
    }
    const filter = this.roomDataFilterService.currentFilter;
    filter.currentSearch = this.searchString;
    this.roomDataFilterService.currentFilter = filter;
  }

  activateSearch() {
    this.search = true;
    this.searchField.nativeElement.focus();
  }

  abortSearch() {
    this.search = false;
    this.searchString = '';
    const filter = this.roomDataFilterService.currentFilter;
    filter.currentSearch = '';
    this.roomDataFilterService.currentFilter = filter;
  }

  onRefreshFiltering(): void {
    const result = this.roomDataFilterService.currentData;
    this.comments = result.comments;
    this.commentsFilteredByTimeLength = result.timeFilteredCount;
    this.isLoading = false;
    if (this.comments.length > 0 && this.firstReceive) {
      this.firstReceive = false;
      if (this.roomDataFilterService.currentFilter.currentSearch) {
        this.search = true;
      }
      this.setFocusedComment(localStorage.getItem('answeringQuestion'));
      this.isJoyrideActive = this.onboardingService.startDefaultTour();
    }
    const allComments = this.roomDataService.getCurrentRoomData();
    this._allQuestionNumberOptions = allComments.map(c => c.number)
      .sort((a, b) => b - a).map(c => String(c));
    const value = this.questionNumberFormControl.value || '';
    this.questionNumberOptions = this._allQuestionNumberOptions.filter(e => e.startsWith(value));
    this.commentsWrittenByUsers.clear();
    for (const comment of this.comments) {
      let set = this.commentsWrittenByUsers.get(comment.creatorId);
      if (!set) {
        set = new Set<string>();
        this.commentsWrittenByUsers.set(comment.creatorId, set);
      }
      set.add(comment.id);
    }
    this.titleService.attachTitle('(' + this.commentsFilteredByTimeLength + ')');
    const filter = this.roomDataFilterService.currentFilter;
    this.filterType = filter.filterType;
    this.sortType = filter.sortType;
    this.sortReverse = filter.sortReverse;
    this.period = filter.period;
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
    const filter = this.roomDataFilterService.currentFilter;
    filter.filterType = FilterType[type];
    filter.filterCompare = compare;
    this.roomDataFilterService.currentFilter = filter;
  }

  applySortingByKey(type: SortTypeKey, reverse = false) {
    const filter = this.roomDataFilterService.currentFilter;
    filter.sortType = SortType[type];
    filter.sortReverse = reverse;
    this.roomDataFilterService.currentFilter = filter;
  }

  votedComment(voteInfo: string) {
    setTimeout(() => this.setFocusedComment(voteInfo), 100);
  }

  activateCommentStream(freezed: boolean) {
    this.freeze = freezed;
    const filter = this.roomDataFilterService.currentFilter;
    filter.freezedAt = freezed ? new Date().getTime() : null;
    this.roomDataFilterService.currentFilter = filter;
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
            this.translateService.get('comment-list.question-was-marked-with-a-star').subscribe(ret => {
              this.notificationService.show(ret);
            });
          }
          if (this.user.id === update.comment.creatorId && !update.comment.favorite) {
            this.translateService.get('comment-list.star-was-withdrawn-from-the-question').subscribe(ret => {
              this.notificationService.show(ret);
            });
          }
        }
      }
      if (update.finished && wasUpdate) {
        this.setFocusedComment(this.sendCommentId);
        this.sendCommentId = null;
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
    const filter = this.roomDataFilterService.currentFilter;
    if (period) {
      filter.period = period;
      filter.fromNow = null;
    }
    this.roomDataFilterService.currentFilter = filter;
  }

  isInCommentNumbers(value: string): boolean {
    return this._allQuestionNumberOptions.indexOf(value) >= 0;
  }

  useCommentNumber(questionNumber: HTMLInputElement, menu: MatMenuTrigger, autoComplete: MatAutocompleteTrigger) {
    if (!this.isInCommentNumbers(questionNumber.value)) {
      return;
    }
    autoComplete.closePanel();
    this.questionNumberFormControl.setValue('');
    menu.closeMenu();
    this.applyFilterByKey('number', +questionNumber.value);
  }

  private receiveRoom(room: Room) {
    this.room = room;
    this.moderationEnabled = room.moderated;
    this.directSend = room.directSend;
    this.commentsEnabled = (this.userRole > UserRole.PARTICIPANT) || !room.questionsBlocked;
  }

  private generateKeywordsIfEmpty(comments: Comment[]) {
    if (TopicCloudFilterComponent.isUpdatable(comments, this.userRole, this.sessionService.currentRoom.id)) {
      TopicCloudFilterComponent.startUpdate(this.dialog, this.room, this.userRole);
    }
  }

  private setFocusedComment(commentId: string) {
    this.focusCommentId = null;
    if (!commentId) {
      return;
    }
    const index = this.comments.findIndex(e => e.id === commentId);
    if (index < 0) {
      return;
    }
    this.pageIndex = Math.floor(index / this.pageSize);
    setTimeout(() => this.focusCommentId = commentId, 100);
  }
}
