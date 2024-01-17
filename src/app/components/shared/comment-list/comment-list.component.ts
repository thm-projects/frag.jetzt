import {
  AfterViewInit,
  Component,
  ComponentRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Comment, numberSorter } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../../models/user';
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
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';
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
  CommentPatchedKeyInformation,
  ForumComment,
} from '../../../utils/data-accessor';
import {
  FilteredDataAccess,
  FilterTypeCounts,
  PeriodCounts,
} from '../../../utils/filtered-data-access';
import { QuillUtils } from '../../../utils/quill-utils';
import { ThemeService } from '../../../../theme/theme.service';
import { ColorContrast } from '../../../utils/color-contrast';
import { EditQuestionComponent } from '../_dialogs/edit-question/edit-question.component';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { AppStateService } from 'app/services/state/app-state.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
})
export class CommentListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('searchBox') searchField: ElementRef;
  @ViewChild('filterMenuTrigger') filterMenuTrigger: MatMenuTrigger;
  @ViewChild('qrCodeColors') qrCodeColors: ElementRef<HTMLDivElement>;
  user: User;
  AppComponent = AppComponent;
  comments: ForumComment[] = [];
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
  createCommentWrapper: CreateCommentWrapper = null;
  isJoyrideActive = false;
  focusCommentId = '';
  sendCommentId = '';
  activeUsers = 0;
  pageIndex = 0;
  pageSize = 25;
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
  private firstReceive = true;
  private _allQuestionNumberOptions: string[] = [];
  private _list: ComponentRef<any>[];
  private _filterObject: FilteredDataAccess;
  private _cloudFilterObject: FilteredDataAccess;
  private _destroySubject = new Subject();
  private _isStarting = true;
  private _matcher: MediaQueryList;

  constructor(
    private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected roomService: RoomService,
    protected voteService: VoteService,
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
    private composeService: ArsComposeService,
    private headerService: HeaderService,
    private cloudDataService: TagCloudDataService,
    private themeService: ThemeService,
    private accountState: AccountStateService,
    private roomState: RoomStateService,
    deviceState: DeviceStateService,
    appState: AppStateService,
  ) {
    appState.language$.pipe(takeUntil(this._destroySubject)).subscribe((_) => {
      this.translateService.get('comment-list.search').subscribe((msg) => {
        this.searchPlaceholder = msg;
      });
    });
    deviceState.mobile$
      .pipe(takeUntil(this._destroySubject))
      .subscribe((m) => (this.isMobile = m));
    themeService
      .getTheme()
      .pipe(takeUntil(this._destroySubject))
      .subscribe((_) => {
        this.updateQrCodeColors();
      });
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
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

  ngOnInit() {
    this.accountState.gptConsented$
      .pipe(takeUntil(this._destroySubject))
      .subscribe((state) => {
        this.consentGPT = state;
      });
    this._filterObject = FilteredDataAccess.buildNormalAccess(
      this.sessionService,
      this.roomDataService,
      false,
      'commentList',
    );
    this._cloudFilterObject = FilteredDataAccess.buildNormalAccess(
      this.sessionService,
      this.roomDataService,
      true,
      'tagCloud',
    );
    const filter = this._cloudFilterObject.dataFilter;
    filter.resetToDefault();
    this._cloudFilterObject.dataFilter = filter;
    this.initNavigation();
    const data = localStorage.getItem('commentListPageSize');
    this.pageSize = data ? +data || this.pageSize : this.pageSize;
    this.accountState.user$
      .pipe(takeUntil(this._destroySubject))
      .subscribe((newUser) => {
        if (!newUser) {
          return;
        }
        this.user = newUser;
        if (
          ROOM_ROLE_MAPPER[this.roomState.getCurrentAssignedRole()] !==
          UserRole.PARTICIPANT
        ) {
          return;
        }
        this.sessionService.getRoomOnce().subscribe((room) => {
          this.voteService
            .getByRoomIdAndUserID(room.id, this.user.id)
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
      setTimeout(() => (this._isStarting = false), 1_500);
      this.receiveRoom(room);
      this.moderatorAccountIds = new Set<string>(mods.map((m) => m.accountId));
      this.sessionService
        .receiveRoomUpdates()
        .subscribe((_room) => this.receiveRoom(_room as Room));
      this.createCommentWrapper = new CreateCommentWrapper(
        this.translateService,
        this.notificationService,
        this.commentService,
        this.dialog,
        this.sessionService.currentRoom,
      );
      this.updateKeywordMark();
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
    this.comments = [...this._filterObject.getCurrentData()];
    this.commentsFilteredByTimeLength =
      this._filterObject.getCurrentPeriodCount();
    this.isLoading = false;
    if (this.comments.length > 0 && this.firstReceive) {
      this.firstReceive = false;
      if (this._filterObject.dataFilter.currentSearch) {
        this.search = true;
      }
      this.setFocusedComment(localStorage.getItem('answeringQuestion'));
    }
    const allComments = [...this._filterObject.getSourceData()];
    allComments.sort((a, b) => numberSorter(a.number, b.number));
    this._allQuestionNumberOptions = allComments.map((c) =>
      Comment.computePrettyCommentNumber(this.translateService, c).join(' '),
    );
    const value = this.questionNumberFormControl.value || '';
    this.questionNumberOptions = this._allQuestionNumberOptions.filter((e) =>
      e.startsWith(value),
    );
    this.commentsWrittenByUsers.clear();
    for (const comment of this.comments) {
      let set = this.commentsWrittenByUsers.get(comment.creatorId);
      if (!set) {
        set = new Set<string>();
        this.commentsWrittenByUsers.set(comment.creatorId, set);
      }
      set.add(comment.id);
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
    this.pageIndex = 0;
    const filter = this._filterObject.dataFilter;
    filter.filterType = null;
    filter.filterCompare = undefined;
    filter.sourceFilterBrainstorming = BrainstormingFilter.ExceptBrainstorming;
    this._filterObject.dataFilter = filter;
    this.updateKeywordMark();
  }

  filterByBrainstorming() {
    this.pageIndex = 0;
    const filter = this._filterObject.dataFilter;
    filter.sourceFilterBrainstorming = BrainstormingFilter.OnlyBrainstorming;
    this._filterObject.dataFilter = filter;
  }

  applyFilterByKey(type: FilterTypeKey, compare?: any): void {
    this.pageIndex = 0;
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
    this.commentStream = this.roomDataService.dataAccessor
      .receiveUpdates([
        { type: 'CommentCreated', finished: true },
        { type: 'CommentPatched', subtype: 'favorite' },
        { finished: true },
      ])
      .subscribe((update) => {
        if (update.type === 'CommentCreated') {
          this.announceNewComment(
            QuillUtils.getTextFromDelta(update.comment.body),
          );
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
    this.router.navigate([
      `/moderator/room/${this.room.shortId}/moderator/comments`,
    ]);
  }

  writeComment() {
    this.createCommentWrapper
      .openCreateDialog(this.user, this.userRole)
      .subscribe((comment) => (this.sendCommentId = comment?.id));
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

  isStarting(): boolean {
    return this._isStarting;
  }

  isCommentListEmpty(): boolean {
    return (
      this.comments &&
      ((this.commentsFilteredByTimeLength < 1 && this.period === 'All') ||
        this.comments.length === 0) &&
      !this.isLoading
    );
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
    const answers = this.comments.reduce(
      (acc, c) => acc + c.totalAnswerCounts.accumulated,
      0,
    );
    return {
      comments: this.comments.length,
      answers,
      moderated:
        this.roomDataService.moderatorDataAccessor.currentRawComments().length,
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
    return (
      this._matcher.matches &&
      this.userRole > UserRole.PARTICIPANT &&
      this.themeService.currentTheme?.key !== 'projector'
    );
  }

  editQuestion(comment: ForumComment) {
    const ref = this.dialog.open(EditQuestionComponent, {
      width: '900px',
      maxWidth: '100%',
      maxHeight: 'calc( 100vh - 20px )',
      autoFocus: false,
    });
    ref.componentInstance.comment = comment;
    ref.componentInstance.tags = this.room.tags;
    ref.componentInstance.userRole = this.userRole;
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

  private onCommentPatched(update: CommentPatchedKeyInformation) {
    if (update.subtype === 'favorite') {
      if (
        this.user.id === update.comment.creatorId &&
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

  private setFocusedComment(commentId: string) {
    this.focusCommentId = null;
    if (!commentId) {
      return;
    }
    const index = this.comments.findIndex((e) => e.id === commentId);
    if (index < 0) {
      return;
    }
    this.pageIndex = Math.floor(index / this.pageSize);
    setTimeout(() => (this.focusCommentId = commentId), 100);
  }

  private initNavigation(): void {
    this.eventService
      .on<unknown>('save-comment-filter')
      .pipe(takeUntil(this._destroySubject))
      .subscribe(() => {
        this._filterObject.dataFilter.save();
      });
    /* eslint-disable @typescript-eslint/no-shadow */
    this._list = this.composeService.builder(
      this.headerService.getHost(),
      (e) => {
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'add',
          class: 'header-icons material-icons-outlined',
          text: 'header.create-question',
          callback: () => this.writeComment(),
          condition: () =>
            !this.isMobile &&
            this.room &&
            !this.room.questionsBlocked &&
            this.room.mode === 'ARS',
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'add',
          class: 'header-icons material-icons-outlined',
          text: 'header.ple.create-question',
          callback: () => this.writeComment(),
          condition: () =>
            !this.isMobile &&
            this.room &&
            !this.room.questionsBlocked &&
            this.room.mode === 'PLE',
        });
        e.menuItem({
          translate: this.headerService.getTranslate(),
          icon: 'file_download',
          class: 'material-icons-outlined',
          text: 'header.export-questions',
          callback: () => {
            const room = this.sessionService.currentRoom;
            exportRoom(
              this.translateService,
              ROOM_ROLE_MAPPER[this.roomState.getCurrentRole()] ||
                UserRole.PARTICIPANT,
              this.notificationService,
              this.bonusTokenService,
              this.commentService,
              'room-export',
              this.user,
              room,
              new Set<string>(this.moderatorAccountIds),
            ).subscribe((text) => {
              copyCSVString(
                text[0],
                room.name + '-' + room.shortId + '-' + text[1] + '.csv',
              );
            });
          },
          condition: () => true,
        });
      },
    );
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
