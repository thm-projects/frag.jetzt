import { Component, ComponentRef, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Comment, numberSorter } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { EventService } from '../../../services/util/event.service';
import { Router } from '@angular/router';
import { AppComponent } from '../../../app.component';
import { NotificationService } from '../../../services/util/notification.service';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { PageEvent } from '@angular/material/paginator';
import { copyCSVString, exportRoom } from '../../../utils/ImportExportMethods';
import { SessionService } from '../../../services/util/session.service';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { forkJoin, Subscription } from 'rxjs';
import { ArsComposeService } from '../../../../../projects/ars/src/lib/services/ars-compose.service';
import { HeaderService } from '../../../services/util/header.service';
import { FormControl } from '@angular/forms';
import { RoomDataService } from '../../../services/util/room-data.service';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import {
  FilterType,
  FilterTypeKey,
  Period,
  PeriodKey,
  SortType,
  SortTypeKey
} from '../../../utils/data-filter-object.lib';
import { FilteredDataAccess } from '../../../utils/filtered-data-access';
import { ForumComment } from '../../../utils/data-accessor';
import { UserManagementService } from '../../../services/util/user-management.service';


@Component({
  selector: 'app-moderator-comment-list',
  templateUrl: './moderator-comment-list.component.html',
  styleUrls: ['./moderator-comment-list.component.scss']
})
export class ModeratorCommentListComponent implements OnInit, OnDestroy {
  @ViewChild('searchBox') searchField: ElementRef;
  @ViewChild('filterMenuTrigger') filterMenuTrigger: MatMenuTrigger;
  user: User;
  roomId: string;
  AppComponent = AppComponent;
  comments: ForumComment[] = [];
  commentsFilteredByTimeLength: number;
  isMobile: boolean;
  room: Room;
  userRole: UserRole;
  isLoading = true;
  read = 'read';
  unread = 'unread';
  favorite = 'favorite';
  correct = 'correct';
  wrong = 'wrong';
  ack = 'ack';
  bookmark = 'bookmark';
  userNumber = 'userNumber';
  scroll = false;
  scrollExtended = false;
  search = false;
  searchPlaceholder = '';
  periodsList = Object.values(Period) as PeriodKey[];
  headerInterface = null;
  pageIndex = 0;
  pageSize = 25;
  pageSizeOptions = [25, 50, 100, 200];
  showFirstLastButtons = true;
  commentsWrittenByUsers: Map<string, Set<string>> = new Map<string, Set<string>>();
  moderatorAccountIds: Set<string>;
  searchString: string;
  filterType: FilterType;
  sortType: SortType;
  sortReverse: boolean;
  period: Period;
  questionNumberFormControl = new FormControl();
  questionNumberOptions: string[] = [];
  private _allQuestionNumberOptions: string[] = [];
  private firstReceive = true;
  private _deviceSub: Subscription;
  private _list: ComponentRef<any>[];
  private _filterObject: FilteredDataAccess;

  constructor(
    private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected roomService: RoomService,
    public eventService: EventService,
    private router: Router,
    private notificationService: NotificationService,
    private bonusTokenService: BonusTokenService,
    private sessionService: SessionService,
    private userManagementService: UserManagementService,
    public deviceInfo: DeviceInfoService,
    private composeService: ArsComposeService,
    private headerService: HeaderService,
    private roomDataService: RoomDataService,
  ) {
    this._deviceSub = this.deviceInfo.isMobile().subscribe(mobile => this.isMobile = mobile);
    this.questionNumberFormControl.valueChanges.subscribe((v) => {
      v = v || '';
      this.questionNumberOptions = this._allQuestionNumberOptions.filter(e => e.startsWith(v));
    });
    this._filterObject = FilteredDataAccess.buildModeratedAccess(
      sessionService, roomDataService, true, true, 'moderatorList',
    );
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }

  ngOnDestroy() {
    this._filterObject.detach(true);
    this._list?.forEach(e => e.destroy());
    this.headerInterface?.unsubscribe();
    this._deviceSub?.unsubscribe();
  }

  ngOnInit() {
    this.initNavigation();
    this.userManagementService.getUser().subscribe(user => {
      if (!user) {
        return;
      }
      this.user = user;
    });
    this.userRole = this.user.role;
    forkJoin([
      this.sessionService.getRoomOnce(),
      this.sessionService.getModeratorsOnce(),
    ]).subscribe(([room, mods]) => {
      this.room = room;
      this.moderatorAccountIds = new Set<string>(mods.map(m => m.accountId));
      this._filterObject.attach({
        ownerId: room.ownerId,
        roomId: room.id,
        userId: this.user.id,
        threshold: room.threshold,
        moderatorIds: this.moderatorAccountIds,
      });
      this._filterObject.getFilteredData().subscribe(() => this.onRefreshFiltering());
    });
    this.translateService.get('comment-list.search').subscribe(msg => {
      this.searchPlaceholder = msg;
    });
  }

  checkScroll(): void {
    const currentScroll = document.documentElement.scrollTop;
    this.scroll = currentScroll >= 65;
    this.scrollExtended = currentScroll >= 300;
  }

  isScrollButtonVisible(): boolean {
    return !AppComponent.isScrolledTop() && this.commentsFilteredByTimeLength > 10;
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
    this.translateService.get('comment-list.search').subscribe(msg => {
      this.searchPlaceholder = msg;
    });
    this.search = true;
    this.searchField.nativeElement.focus();
  }

  abortSearch() {
    this.search = false;
    const filter = this._filterObject.dataFilter;
    filter.currentSearch = '';
    this._filterObject.dataFilter = filter;
  }

  onRefreshFiltering(): void {
    this.comments = [...this._filterObject.getCurrentData()];
    this.commentsFilteredByTimeLength = this._filterObject.getCurrentPeriodCount();
    this.isLoading = false;
    if (this.firstReceive && this.comments.length > 0) {
      this.firstReceive = false;
      if (this._filterObject.dataFilter.currentSearch) {
        this.search = true;
      }
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
    const filter = this._filterObject.dataFilter;
    this.filterType = filter.filterType;
    this.sortType = filter.sortType;
    this.sortReverse = filter.sortReverse;
    this.period = filter.period;
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

  switchToCommentList(): void {
    let role;
    if (this.userRole === UserRole.CREATOR.valueOf()) {
      role = 'creator';
    } else if (this.userRole === UserRole.EXECUTIVE_MODERATOR) {
      role = 'moderator';
    }
    this.router.navigate([`/${role}/room/${this.room.shortId}/comments`]);
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
    autoComplete.closePanel();
    this.questionNumberFormControl.setValue('');
    menu.closeMenu();
    this.applyFilterByKey('Number', +questionNumber.value);
  }

  private initNavigation() {
    this._list = this.composeService.builder(this.headerService.getHost(), e => {
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'forum',
        class: 'material-icons-outlined',
        text: 'header.back-to-questionboard',
        callback: () => {
          const role = (this.userRole === 3 ? 'creator' : 'moderator');
          this.router.navigate([role + '/room/' + this.room?.shortId + '/comments']);
        },
        condition: () => true
      });
      e.menuItem({
        translate: this.headerService.getTranslate(),
        icon: 'file_download',
        class: 'material-icons-outlined',
        text: 'header.export-questions',
        callback: () => {
          exportRoom(this.translateService,
            this.notificationService,
            this.bonusTokenService,
            this.commentService,
            'room-export',
            this.user,
            this.room,
            this.moderatorAccountIds
          ).subscribe(text => {
            copyCSVString(text[0], this.room.name + '-' + this.room.shortId + '-' + text[1] + '.csv');
          });
        },
        condition: () => true
      });
    });
  }
}
