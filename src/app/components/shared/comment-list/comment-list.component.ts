import { Component, ComponentRef, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Comment, numberSorter } from '../../../models/comment';
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
import { forkJoin, Subject, Subscription, takeUntil } from 'rxjs';
import { AppComponent } from '../../../app.component';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { TitleService } from '../../../services/util/title.service';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { CreateCommentWrapper } from '../../../utils/create-comment-wrapper';
import { RoomDataService } from '../../../services/util/room-data.service';
import { OnboardingService } from '../../../services/util/onboarding.service';
import { PageEvent } from '@angular/material/paginator';
import { TopicCloudFilterComponent } from '../_dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { FormControl } from '@angular/forms';
import { copyCSVString, exportRoom } from '../../../utils/ImportExportMethods';
import { BrainstormingService } from '../../../services/http/brainstorming.service';
import { SessionService } from '../../../services/util/session.service';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';
import { TagCloudDataService } from '../../../services/util/tag-cloud-data.service';
import { Palette } from '../../../../theme/Theme';
import { BonusTokenComponent } from '../../creator/_dialogs/bonus-token/bonus-token.component';
import {
  FilterType,
  FilterTypeKey,
  Period,
  PeriodKey,
  SortType,
  SortTypeKey
} from '../../../utils/data-filter-object.lib';
import { CommentPatchedKeyInformation, ForumComment } from '../../../utils/data-accessor';
import { FilteredDataAccess, FilterTypeCounts, PeriodCounts } from '../../../utils/filtered-data-access';
import { QuillUtils } from '../../../utils/quill-utils';

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
  comments: ForumComment[] = [];
  commentsFilteredByTimeLength: number;
  room: Room;
  userRole: UserRole;
  isLoading = true;
  commentVoteMap = new Map<string, Vote>();
  scroll = false;
  scrollExtended = false;
  search = false;
  searchPlaceholder = '';
  directSend = true;
  newestComment: string;
  freeze = false;
  commentStream: Subscription;
  periodsList = Object.values(Period) as PeriodKey[];
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
  filterTypeCounts: FilterTypeCounts;
  sortType: SortType;
  sortReverse: boolean;
  period: Period;
  periodCounts: PeriodCounts;
  moderatorAccountIds: Set<string>;
  hasGivenJoyride = false;
  private firstReceive = true;
  private _allQuestionNumberOptions: string[] = [];
  private _list: ComponentRef<any>[];
  private _filterObject: FilteredDataAccess;
  private _cloudFilterObject: FilteredDataAccess;
  private _destroySubject = new Subject();

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
    private onboardingService: OnboardingService,
    private brainstormingService: BrainstormingService,
    private sessionService: SessionService,
    public deviceInfo: DeviceInfoService,
    private composeService: ArsComposeService,
    private headerService: HeaderService,
    private cloudDataService: TagCloudDataService,
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

  ngOnInit() {
    this._filterObject = FilteredDataAccess
      .buildNormalAccess(this.sessionService, this.roomDataService, false, true, 'commentList');
    this._cloudFilterObject = FilteredDataAccess
      .buildNormalAccess(this.sessionService, this.roomDataService, true, false, 'tagCloud');
    const filter = this._cloudFilterObject.dataFilter;
    filter.resetToDefault();
    this._cloudFilterObject.dataFilter = filter;
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
      this.sessionService.getRoomOnce().subscribe(room => {
        this.voteService.getByRoomIdAndUserID(room.id, this.user.id).subscribe(votes => {
          for (const v of votes) {
            this.commentVoteMap.set(v.commentId, v);
          }
        });
      });
    });
    this.userRole = this.sessionService.currentRole;
    forkJoin([
      this.sessionService.getRoomOnce(),
      this.sessionService.getModeratorsOnce(),
    ]).subscribe(([room, mods]) => {
      this.receiveRoom(room);
      this.moderatorAccountIds = new Set<string>(mods.map(m => m.accountId));
      this.sessionService.receiveRoomUpdates().subscribe(_room => this.receiveRoom(_room as Room));
      this.createCommentWrapper = new CreateCommentWrapper(this.translateService,
        this.notificationService, this.commentService, this.dialog, this.sessionService.currentRoom);
      this._filterObject.attach({
        userId: this.user.id,
        roomId: room.id,
        ownerId: room.ownerId,
        threshold: room.threshold,
        moderatorIds: this.moderatorAccountIds,
      });
      let hasUpdated = false;
      this._filterObject.getFilteredData().subscribe(() => {
        if (!hasUpdated) {
          hasUpdated = true;
          this.generateKeywordsIfEmpty([...this._filterObject.getSourceData()]);
        }
        this.onRefreshFiltering();
      });
      this._cloudFilterObject.attach({
        userId: this.user.id,
        roomId: room.id,
        ownerId: room.ownerId,
        threshold: room.threshold,
        moderatorIds: this.moderatorAccountIds,
      });
      this.cloudDataService.filterObject = this._cloudFilterObject;
      this.subscribeCommentStream();
    });
    this.translateService.get('comment-list.search').subscribe(msg => {
      this.searchPlaceholder = msg;
    });
  }

  ngOnDestroy() {
    this._destroySubject.next(true);
    this._destroySubject.complete();
    this._cloudFilterObject.detach();
    this._filterObject.detach();
    this._list?.forEach(e => e.destroy());
    this.commentStream?.unsubscribe();
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
    const filter = this._filterObject.dataFilter;
    filter.currentSearch = this.searchString;
    this._filterObject.dataFilter = filter;
  }

  activateSearch() {
    this.search = true;
    this.searchField.nativeElement.focus();
  }

  abortSearch() {
    this.search = false;
    this.searchString = '';
    const filter = this._filterObject.dataFilter;
    filter.currentSearch = '';
    this._filterObject.dataFilter = filter;
  }

  onRefreshFiltering(): void {
    this.comments = [...this._filterObject.getCurrentData()];
    this.commentsFilteredByTimeLength = this._filterObject.getCurrentPeriodCount();
    this.isLoading = false;
    if (this.comments.length > 0 && this.firstReceive) {
      this.firstReceive = false;
      if (this._filterObject.dataFilter.currentSearch) {
        this.search = true;
      }
      this.setFocusedComment(localStorage.getItem('answeringQuestion'));
      this.isJoyrideActive = this.onboardingService.startDefaultTour();
    }
    const allComments = [...this._filterObject.getSourceData()];
    allComments.sort((a, b) => numberSorter(a.number, b.number));
    this._allQuestionNumberOptions = allComments.map(c => Comment.computePrettyCommentNumber(this.translateService, c)
      .join(' '));
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
    const filter = this._filterObject.dataFilter;
    this.filterType = filter.filterType;
    this.sortType = filter.sortType;
    this.sortReverse = filter.sortReverse;
    this.period = filter.period;
    this.periodCounts = this._filterObject.getPeriodCounts();
    this.filterTypeCounts = this._filterObject.getFilterTypeCounts();
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
    const filter = this._filterObject.dataFilter;
    filter.filterType = FilterType[type];
    filter.filterCompare = compare;
    this._filterObject.dataFilter = filter;
  }

  applySortingByKey(type: SortTypeKey, reverse = false) {
    const filter = this._filterObject.dataFilter;
    filter.sortType = SortType[type];
    filter.sortReverse = reverse;
    this._filterObject.dataFilter = filter;
  }

  votedComment(voteInfo: string) {
    setTimeout(() => this.setFocusedComment(voteInfo), 100);
  }

  activateCommentStream(freezed: boolean) {
    this.freeze = freezed;
    const filter = this._filterObject.dataFilter;
    filter.frozenAt = freezed ? new Date().getTime() : null;
    this._filterObject.dataFilter = filter;
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
    this.commentStream = this.roomDataService.dataAccessor.receiveUpdates([
      { type: 'CommentCreated', finished: true },
      { type: 'CommentPatched', subtype: 'favorite' },
      { finished: true }
    ]).subscribe(update => {
      if (update.type === 'CommentCreated') {
        this.announceNewComment(QuillUtils.getTextFromDelta(update.comment.body));
        if (update.comment.id && update.comment.id === this.sendCommentId) {
          wasUpdate = true;
        }
      } else if (update.type === 'CommentPatched') {
        this.onCommentPatched(update as CommentPatchedKeyInformation);
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
    this.newestComment = comment;

    // Currently the only possible way to announce the new comment text
    // @see https://github.com/angular/angular/issues/11405
    setTimeout(() => {
      const newCommentText: string = document.getElementById('new-comment').innerText;

      // current live announcer content must be cleared before next read
      this.liveAnnouncer.clear();

      this.liveAnnouncer.announce(newCommentText).catch(err => {
        console.error(err);
        this.translateService.get('comment-list.a11y-announce-error').subscribe(msg => {
          this.notificationService.show(msg);
        });
      });
    }, 450);
  }

  setTimePeriod(period?: PeriodKey) {
    const filter = this._filterObject.dataFilter;
    filter.period = Period[period];
    filter.timeFilterStart = Date.now();
    this._filterObject.dataFilter = filter;
  }

  isInCommentNumbers(value: string): boolean {
    return this._allQuestionNumberOptions.indexOf(value) >= 0;
  }

  useCommentNumber(questionNumber: HTMLInputElement, menu: MatMenuTrigger, autoComplete: MatAutocompleteTrigger) {
    if (!this.isInCommentNumbers(questionNumber.value)) {
      return;
    }
    const value = questionNumber.value.match(/\d+/g)[0];
    autoComplete.closePanel();
    this.questionNumberFormControl.setValue('');
    menu.closeMenu();
    this.applyFilterByKey('Number', value);
  }

  isCommentListEmpty(): boolean {
    return this.comments &&
      (this.commentsFilteredByTimeLength < 1 && this.period === 'All' || this.comments.length === 0) &&
      !this.isLoading;
  }

  getSlicedComments(): ForumComment[] {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.hasGivenJoyride = false;
    return this.comments.slice(start, end);
  }

  requestJoyride(comment: Comment): boolean {
    if (this.hasGivenJoyride) {
      return false;
    }
    if (this.commentsWrittenByUsers.get(comment.creatorId).size > 1) {
      this.hasGivenJoyride = true;
      return true;
    }
    return false;
  }

  getCommentInfo() {
    const answers = this.comments.reduce((acc, c) => acc + c.totalAnswerCount, 0);
    return {
      comments: this.comments.length,
      answers,
      moderated: this.roomDataService.moderatorDataAccessor.currentRawComments().length,
    } as const;
  }

  private onCommentPatched(update: CommentPatchedKeyInformation) {
    if (update.subtype === 'favorite') {
      if (this.user.id === update.comment.creatorId && this.userRole === UserRole.PARTICIPANT &&
        this.room?.bonusArchiveActive) {
        const text = update.comment.favorite ? 'comment-list.question-was-marked-with-a-star' :
          'comment-list.star-was-withdrawn-from-the-question';
        this.translateService.get(text).subscribe(ret => this.notificationService.show(ret));
      }
    }
  }

  private receiveRoom(room: Room) {
    this.room = room;
    this.directSend = room.directSend;
    this.commentsEnabled = (this.userRole > UserRole.PARTICIPANT) || !room.questionsBlocked;
  }

  private generateKeywordsIfEmpty(comments: Comment[]) {
    if (TopicCloudFilterComponent.isUpdatable(comments, this.userRole, this.sessionService.currentRoom.id)) {
      // TO-DO: Enable if valid
      // do: TopicCloudFilterComponent.startUpdate(this.dialog, this.room, this.userRole);
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

  private initNavigation(): void {
    this.eventService.on<string>('navigate')
      .pipe(takeUntil(this._destroySubject))
      .subscribe(action => {
        if (action === 'topic-cloud') {
          this.navigateTopicCloud();
        }
      });
    /* eslint-disable @typescript-eslint/no-shadow */
    this._list = this.composeService.builder(this.headerService.getHost(), e => {
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'add',
        class: 'header-icons material-icons-outlined',
        text: 'header.create-question',
        callback: () => this.writeComment(),
        condition: () => this.deviceInfo.isCurrentlyDesktop &&
          this.room && !this.room.questionsBlocked
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'qr_code',
        class: 'header-icons',
        text: 'header.room-qr',
        callback: () => this.headerService.getHeaderComponent().showQRDialog(),
        condition: () => this.userRole > 0
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'gavel',
        class: 'material-icons-round',
        text: 'header.moderationboard',
        callback: () => {
          const role = (this.userRole === 3 ? 'creator' : 'moderator');
          this.router.navigate([role + '/room/' + this.room?.shortId + '/moderator/comments']);
        },
        condition: () => this.userRole > 0
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'radar',
        class: '',
        text: 'header.tag-cloud',
        callback: () => this.navigateTopicCloud(),
        condition: () => this.deviceInfo.isCurrentlyMobile && ((this.cloudDataService.currentData?.size || 0) > 0)
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'psychology_alt',
        class: 'material-icons-outlined',
        text: 'header.brainstorming',
        callback: () => this.headerService.getHeaderComponent().navigateBrainstorming(),
        condition: () => this.deviceInfo.isCurrentlyMobile && this.room?.brainstormingActive &&
          (!!this.room?.brainstormingSession || this.userRole > UserRole.PARTICIPANT)
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'rocket_launch',
        class: 'material-icons-outlined',
        text: 'header.quiz-now',
        callback: () => this.router.navigate(['quiz']),
        condition: () => this.deviceInfo.isCurrentlyMobile && this.room?.quizActive
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'grade',
        class: 'material-icons-round',
        iconColor: Palette.YELLOW,
        text: 'header.bonustoken',
        callback: () => this.showBonusTokenDialog(),
        condition: () => this.userRole > UserRole.PARTICIPANT && this.room?.bonusArchiveActive
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'file_download',
        class: 'material-icons-outlined',
        text: 'header.export-questions',
        callback: () => {
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
        },
        condition: () => true
      });
    });
  }

  private showBonusTokenDialog(): void {
    console.assert(this.userRole > UserRole.PARTICIPANT);
    const dialogRef = this.dialog.open(BonusTokenComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.room = this.room;
  }

  private navigateTopicCloud() {
    const confirmDialogRef = this.dialog.open(TopicCloudFilterComponent, {
      autoFocus: false,
      data: {
        filterObject: this._filterObject
      }
    });
    confirmDialogRef.componentInstance.target = this.router.url + '/tagcloud';
    confirmDialogRef.componentInstance.userRole = this.userRole;
  }
}
