import {
  AfterViewInit,
  Component,
  ComponentRef,
  computed,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { Comment, numberSorter } from '../../../models/comment';
import { TranslateService } from '@ngx-translate/core';
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
import { TitleService } from '../../../services/util/title.service';
import { TopicCloudFilterComponent } from '../../../room/tag-cloud/dialogs/topic-cloud-filter/topic-cloud-filter.component';
import { FormControl } from '@angular/forms';
import { SessionService } from '../../../services/util/session.service';
import { TagCloudDataService } from '../../../services/util/tag-cloud-data.service';
import {
  BrainstormingFilter,
  FilterType,
  FilterTypeKey,
  Period,
  PeriodKey,
  SortType,
  SortTypeKey,
} from '../../../utils/data-filter-object.lib';
import {
  FilteredDataAccess,
  FilterTypeCounts,
  PeriodCounts,
} from '../../../utils/filtered-data-access';
import { ColorContrast } from '../../../utils/color-contrast';
import { EditQuestionComponent } from '../_dialogs/edit-question/edit-question.component';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { AppStateService } from 'app/services/state/app-state.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { user, user$ } from 'app/user/state/user';
import { Filter } from 'app/room/comment/comment/comment.component';
import { writeInteractiveComment } from 'app/room/comment/util/create-comment';
import {
  afterUpdate,
  PatchComment,
  UIComment,
  uiModeratedComments,
} from 'app/room/state/comment-updates';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
  standalone: false,
})
export class CommentListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('searchBox') searchField: ElementRef;
  @ViewChild('filterMenuTrigger') filterMenuTrigger: MatMenuTrigger;
  @ViewChild('qrCodeColors') qrCodeColors: ElementRef<HTMLDivElement>;
  AppComponent = AppComponent;
  commentsFilteredByTimeLength: number;
  room: Room;
  userRole: UserRole;
  isLoading = true;
  commentVoteMap = {};
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
  isJoyrideActive = false;
  focusCommentId = '';
  sendCommentId = '';
  activeUsers = 0;
  pageSizeOptions = [25, 50, 100, 200];
  showFirstLastButtons = true;
  commentsWrittenByUsers: Map<string, Set<string>> = new Map<
    string,
    Set<string>
  >();
  questionNumberFormControl = new FormControl();
  questionNumberOptions: string[] = [];
  searchString: string;
  filterType: FilterType;
  filterTypeCounts: FilterTypeCounts;
  filterBrainstorming: boolean;
  sortType: SortType;
  sortReverse: boolean;
  period: Period;
  periodCounts: PeriodCounts;
  moderatorAccountIds: Set<string>;
  hasGivenJoyride = false;
  qrDark = '#000000';
  qrLight = '#F0F8FF';
  activeKeyword = null;
  canOpenGPT = false;
  consentGPT = false;
  isMobile = false;
  protected readonly comments = signal<UIComment[]>([]);
  protected readonly pageIndex = signal<number>(0);
  protected readonly pageSize = signal<number>(25);
  protected slicedComments = computed(() => {
    const size = this.pageSize();
    const start = this.pageIndex() * size;
    return this.comments().slice(start, start + size);
  });
  protected readonly user = user;
  protected writeCommentBound = this.writeComment.bind(this);
  private firstReceive = true;
  private _allQuestionNumberOptions: string[] = [];
  private _list: ComponentRef<unknown>[];
  private _filterObject: FilteredDataAccess;
  private _cloudFilterObject: FilteredDataAccess;
  private _destroySubject = new Subject();
  private _matcher: MediaQueryList;
  private injector = inject(Injector);

  constructor(
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected roomService: RoomService,
    protected voteService: VoteService,
    private notificationService: NotificationService,
    public eventService: EventService,
    public liveAnnouncer: LiveAnnouncer,
    private router: Router,
    private titleService: TitleService,
    private sessionService: SessionService,
    private cloudDataService: TagCloudDataService,
    private accountState: AccountStateService,
    private roomState: RoomStateService,
    deviceState: DeviceStateService,
    appState: AppStateService,
  ) {
    appState.language$.pipe(takeUntil(this._destroySubject)).subscribe(() => {
      this.translateService.get('comment-list.search').subscribe((msg) => {
        this.searchPlaceholder = msg;
      });
    });
    deviceState.mobile$
      .pipe(takeUntil(this._destroySubject))
      .subscribe((m) => (this.isMobile = m));
    // TODO: Fix
    this.updateQrCodeColors();
    this.questionNumberFormControl.valueChanges.subscribe((v) => {
      v = v || '';
      this.questionNumberOptions = this._allQuestionNumberOptions.filter((e) =>
        e.startsWith(v),
      );
    });
    this._matcher = matchMedia('(min-width: 1320px)');
    this.sessionService
      .getGPTStatusOnce()
      .subscribe(
        (data) => (this.canOpenGPT = Boolean(data) && !data.restricted),
      );
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }

  ngOnInit() {
    this.accountState.gptConsented$
      .pipe(takeUntil(this._destroySubject))
      .subscribe((state) => {
        this.consentGPT = state;
      });
    this._filterObject = FilteredDataAccess.buildNormalAccess(
      this.sessionService,
      this.injector,
      false,
      'commentList',
    );
    this._cloudFilterObject = FilteredDataAccess.buildNormalAccess(
      this.sessionService,
      this.injector,
      true,
      'tagCloud',
    );
    const filter = this._cloudFilterObject.dataFilter;
    filter.resetToDefault();
    this._cloudFilterObject.dataFilter = filter;
    // this.initNavigation();
    const data = localStorage.getItem('commentListPageSize');
    const currentSize = this.pageSize();
    this.pageSize.set(data ? +data || currentSize : currentSize);
    user$.pipe(takeUntil(this._destroySubject)).subscribe((newUser) => {
      if (!newUser) {
        return;
      }
      if (
        ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] !==
        UserRole.PARTICIPANT
      ) {
        return;
      }
      this.sessionService.getRoomOnce().subscribe((room) => {
        this.voteService
          .getByRoomIdAndUserID(room.id, user().id)
          .subscribe((votes) => {
            for (const v of votes) {
              this.commentVoteMap[v.commentId] = v;
            }
          });
      });
    });
    forkJoin([
      this.sessionService.getRoomOnce(),
      this.sessionService.getModeratorsOnce(),
    ]).subscribe(([room, mods]) => {
      this.userRole = ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()];
      this.receiveRoom(room);
      this.moderatorAccountIds = new Set<string>(mods.map((m) => m.accountId));
      this.sessionService
        .receiveRoomUpdates()
        .subscribe((_room) => this.receiveRoom(_room as Room));
      this.updateKeywordMark();
      this._filterObject.attach({
        userId: user().id,
        roomId: room.id,
        ownerId: room.ownerId,
        threshold: room.threshold,
        moderatorIds: this.moderatorAccountIds,
      });
      let hasUpdated = false;
      this._filterObject.getFilteredData().subscribe(() => {
        if (!hasUpdated) {
          hasUpdated = true;
          this.generateKeywordsIfEmpty([
            ...this._filterObject.getSourceData().map((e) => e.comment),
          ]);
        }
        this.onRefreshFiltering();
      });
      this._cloudFilterObject.attach({
        userId: user().id,
        roomId: room.id,
        ownerId: room.ownerId,
        threshold: room.threshold,
        moderatorIds: this.moderatorAccountIds,
      });
      this.cloudDataService.filterObject = this._cloudFilterObject;
      this.subscribeCommentStream();
    });
    this.translateService.get('comment-list.search').subscribe((msg) => {
      this.searchPlaceholder = msg;
    });
  }

  ngAfterViewInit() {
    this.updateQrCodeColors();
  }

  ngOnDestroy() {
    this._destroySubject.next(true);
    this._destroySubject.complete();
    this._cloudFilterObject.detach();
    this._filterObject.detach(true);
    this._list?.forEach((e) => e.destroy());
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

  searchComments(): void {
    this.search = true;
    if (!this.searchString) {
      return;
    }
    const filter = this._filterObject.dataFilter;
    filter.currentSearch = this.searchString;
    filter.sourceFilterBrainstorming = null;
    this._filterObject.dataFilter = filter;
  }

  activateSearch() {
    this.search = true;
    this.searchField.nativeElement.focus();
    const filter = this._filterObject.dataFilter;
    filter.sourceFilterBrainstorming = null;
    this._filterObject.dataFilter = filter;
  }

  abortSearch() {
    this.search = false;
    this.searchString = '';
    const filter = this._filterObject.dataFilter;
    filter.currentSearch = '';
    filter.sourceFilterBrainstorming = BrainstormingFilter.ExceptBrainstorming;
    this._filterObject.dataFilter = filter;
  }

  onRefreshFiltering(): void {
    this.comments.set([...this._filterObject.getCurrentData()]);
    this.commentsFilteredByTimeLength =
      this._filterObject.getCurrentPeriodCount();
    this.isLoading = false;
    if (this.comments().length > 0 && this.firstReceive) {
      this.firstReceive = false;
      if (this._filterObject.dataFilter.currentSearch) {
        this.search = true;
      }
      this.setFocusedComment(localStorage.getItem('answeringQuestion'));
    }
    const allComments = [...this._filterObject.getSourceData()];
    allComments.sort((a, b) =>
      numberSorter(a.comment.number, b.comment.number),
    );
    this._allQuestionNumberOptions = allComments.map((c) =>
      Comment.computePrettyCommentNumber(this.translateService, c.comment).join(
        ' ',
      ),
    );
    const value = this.questionNumberFormControl.value || '';
    this.questionNumberOptions = this._allQuestionNumberOptions.filter((e) =>
      e.startsWith(value),
    );
    this.commentsWrittenByUsers.clear();
    for (const comment of this.comments()) {
      let set = this.commentsWrittenByUsers.get(comment.comment.creatorId);
      if (!set) {
        set = new Set<string>();
        this.commentsWrittenByUsers.set(comment.comment.creatorId, set);
      }
      set.add(comment.comment.id);
    }
    this.titleService.attachTitle(
      '(' + this.commentsFilteredByTimeLength + ')',
    );
    const filter = this._filterObject.dataFilter;
    this.filterType = filter.filterType;
    this.sortType = filter.sortType;
    this.sortReverse = filter.sortReverse;
    this.period = filter.period;
    this.filterBrainstorming =
      filter.sourceFilterBrainstorming ===
      BrainstormingFilter.OnlyBrainstorming;
    this.periodCounts = this._filterObject.getPeriodCounts();
    this.filterTypeCounts = this._filterObject.getFilterTypeCounts();
  }

  closeDialog() {
    this.dialog.closeAll();
  }

  resetFiltering() {
    this.pageIndex.set(0);
    const filter = this._filterObject.dataFilter;
    filter.filterType = null;
    filter.filterCompare = undefined;
    filter.sourceFilterBrainstorming = BrainstormingFilter.ExceptBrainstorming;
    this._filterObject.dataFilter = filter;
    this.updateKeywordMark();
  }

  filterByBrainstorming() {
    this.pageIndex.set(0);
    const filter = this._filterObject.dataFilter;
    filter.sourceFilterBrainstorming = BrainstormingFilter.OnlyBrainstorming;
    this._filterObject.dataFilter = filter;
  }

  applyFilterByKey(type: FilterTypeKey, compare?: unknown): void {
    this.pageIndex.set(0);
    const filter = this._filterObject.dataFilter;
    filter.filterType = FilterType[type];
    filter.filterCompare = compare;
    this._filterObject.dataFilter = filter;
    this.updateKeywordMark();
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
    this.translateService.get(message).subscribe((msg) => {
      this.notificationService.show(msg);
    });
  }

  subscribeCommentStream() {
    let wasUpdate = false;
    this.commentStream = afterUpdate.subscribe((update) => {
      if (update.type === 'CommentCreated') {
        this.announceNewComment(update.comment.body);
        if (update.comment.id && update.comment.id === this.sendCommentId) {
          wasUpdate = true;
        }
      } else if (update.type === 'CommentPatched') {
        this.onCommentPatched(update);
      }
      if (wasUpdate) {
        this.setFocusedComment(this.sendCommentId);
        this.sendCommentId = null;
      }
    });
  }

  switchToModerationList(): void {
    this.router.navigate([
      `/moderator/room/${this.room.shortId}/moderator/comments`,
    ]);
  }

  writeComment() {
    writeInteractiveComment(this.injector).subscribe(
      (comment) => (this.sendCommentId = comment?.id),
    );
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
      const newCommentText: string =
        document.getElementById('new-comment').innerText;

      // current live announcer content must be cleared before next read
      this.liveAnnouncer.clear();

      this.liveAnnouncer.announce(newCommentText).catch((err) => {
        console.error(err);
        this.translateService
          .get('comment-list.a11y-announce-error')
          .subscribe((msg) => {
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

  useCommentNumber(
    questionNumber: HTMLInputElement,
    menu: MatMenuTrigger,
    autoComplete: MatAutocompleteTrigger,
  ) {
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
    return (
      this.comments() &&
      ((this.commentsFilteredByTimeLength < 1 && this.period === 'All') ||
        this.comments().length === 0) &&
      !this.isLoading
    );
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
    const answers = this.comments().reduce(
      (acc, c) =>
        acc +
        c.totalAnswerCount.participants +
        c.totalAnswerCount.moderators +
        c.totalAnswerCount.creator,
      0,
    );
    return {
      comments: this.comments().length,
      answers,
      moderated: uiModeratedComments()?.rawComments?.length || 0,
    } as const;
  }

  getURL() {
    const room = this.sessionService.currentRoom;
    if (!room) {
      return location.href;
    }
    return `${location.origin}/participant/room/${room.shortId}`;
  }

  canShowURL() {
    return this._matcher.matches && this.userRole > UserRole.PARTICIPANT;
  }

  editQuestion(comment: UIComment) {
    EditQuestionComponent.open(this.dialog, comment.comment);
  }

  protected openFilterMenu() {
    this._filterObject.updateCount(Boolean(this.searchString));
  }

  private updateQrCodeColors() {
    const div = this.qrCodeColors?.nativeElement;
    if (!div) {
      return;
    }
    const computed = getComputedStyle(div);
    const color = ColorContrast.rgbFromCSS(computed.color);
    const color2 = ColorContrast.rgbFromCSS(computed.backgroundColor);
    const luminance = ColorContrast.getWCAGRelativeLuminance(
      ColorContrast.rgbToSrgb(color),
    );
    const luminance2 = ColorContrast.getWCAGRelativeLuminance(
      ColorContrast.rgbToSrgb(color2),
    );
    if (luminance > luminance2) {
      this.qrDark = ColorContrast.rgbToHex(color2);
      this.qrLight = ColorContrast.rgbToHex(color);
    } else {
      this.qrDark = ColorContrast.rgbToHex(color);
      this.qrLight = ColorContrast.rgbToHex(color2);
    }
  }

  private onCommentPatched(update: PatchComment) {
    if ('favorite' in update.changes) {
      if (
        user().id === update.comment.creatorId &&
        this.userRole === UserRole.PARTICIPANT &&
        this.room?.bonusArchiveActive
      ) {
        const text = update.comment.favorite
          ? 'comment-list.question-was-marked-with-a-star'
          : 'comment-list.star-was-withdrawn-from-the-question';
        this.translateService
          .get(text)
          .subscribe((ret) => this.notificationService.show(ret));
      }
    }
  }

  private receiveRoom(room: Room) {
    this.room = room;
    this.directSend = room.directSend;
    this.commentsEnabled =
      this.userRole > UserRole.PARTICIPANT || !room.questionsBlocked;
  }

  private generateKeywordsIfEmpty(comments: Comment[]) {
    if (
      TopicCloudFilterComponent.isUpdatable(
        comments,
        this.userRole,
        this.sessionService.currentRoom.id,
      )
    ) {
      // TO-DO: Enable if valid
      // do: TopicCloudFilterComponent.startUpdate(this.dialog, this.room, this.userRole);
    }
  }

  protected selectFilter(filter: Filter) {
    if (filter.type === 'tag') {
      this.applyFilterByKey('Tag', filter.option);
    } else if (filter.type === 'keyword') {
      this.applyFilterByKey('Keyword', filter.option);
    } else if (filter.type === 'user') {
      this.applyFilterByKey('CreatorId', filter.option);
    }
  }

  private setFocusedComment(commentId: string) {
    this.focusCommentId = null;
    if (!commentId) {
      return;
    }
    const index = this.comments().findIndex((e) => e.comment.id === commentId);
    if (index < 0) {
      return;
    }
    this.pageIndex.set(Math.floor(index / this.pageSize()));
    setTimeout(() => (this.focusCommentId = commentId), 100);
  }

  private updateKeywordMark() {
    const f = this._filterObject.dataFilter;
    if (f.filterType === FilterType.Keyword) {
      this.activeKeyword = f.filterCompare;
    } else {
      this.activeKeyword = null;
    }
  }
}
