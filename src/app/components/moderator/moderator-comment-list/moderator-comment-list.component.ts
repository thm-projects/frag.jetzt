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
import { EventService } from '../../../services/util/event.service';
import { Router } from '@angular/router';
import { AppComponent } from '../../../app.component';
import { ModeratorsComponent } from '../../creator/_dialogs/moderators/moderators.component';
import { TagsComponent } from '../../creator/_dialogs/tags/tags.component';
import { DeleteCommentsComponent } from '../../creator/_dialogs/delete-comments/delete-comments.component';
import { NotificationService } from '../../../services/util/notification.service';
import { BonusTokenService } from '../../../services/http/bonus-token.service';
import { PageEvent } from '@angular/material/paginator';
import { copyCSVString, exportRoom } from '../../../utils/ImportExportMethods';
import {
  FilterType,
  FilterTypeKey,
  Period,
  RoomDataFilter,
  SortType,
  SortTypeKey
} from '../../../services/util/room-data-filter';
import { SessionService } from '../../../services/util/session.service';
import { RoomDataFilterService } from '../../../services/util/room-data-filter.service';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { DeviceInfoService } from '../../../services/util/device-info.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-moderator-comment-list',
  templateUrl: './moderator-comment-list.component.html',
  styleUrls: ['./moderator-comment-list.component.scss']
})
export class ModeratorCommentListComponent implements OnInit, OnDestroy {
  @ViewChild('searchBox') searchField: ElementRef;
  user: User;
  roomId: string;
  AppComponent = AppComponent;
  comments: Comment[] = [];
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
  commentVoteMap = new Map<string, Vote>();
  scroll = false;
  scrollExtended = false;
  search = false;
  searchPlaceholder = '';
  periodsList = Object.values(Period);
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
  private firstReceive = true;
  private _deviceSub: Subscription;
  private _commentsSub: Subscription;

  constructor(
    private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected langService: LanguageService,
    protected roomService: RoomService,
    public eventService: EventService,
    private router: Router,
    private notificationService: NotificationService,
    private bonusTokenService: BonusTokenService,
    private roomDataFilterService: RoomDataFilterService,
    private sessionService: SessionService,
    private authenticationService: AuthenticationService,
    private deviceInfo: DeviceInfoService,
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
    this._deviceSub = this.deviceInfo.isMobile().subscribe(mobile => this.isMobile = mobile);
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
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
            this.translateService.get('room-page.comments-deleted').subscribe(msg => {
              this.notificationService.show(msg);
            });
            this.commentService.deleteCommentsByRoomId(this.roomId).subscribe();
          }
        });
    });
    nav('exportQuestions', () => {
      exportRoom(this.translateService,
        this.notificationService,
        this.bonusTokenService,
        this.commentService,
        'comment-list',
        this.user,
        this.room,
        this.moderatorAccountIds
      ).subscribe(text => {
        copyCSVString(text[0], this.room.name + '-' + this.room.shortId + '-' + text[1] + '.csv');
      });
    });
    this.headerInterface = this.eventService.on<string>('navigate').subscribe(e => {
      if (navigation.hasOwnProperty(e)) {
        navigation[e]();
      }
    });
  }

  ngOnDestroy() {
    this.roomDataFilterService.currentFilter.save('moderatorList');
    this.roomDataFilterService.isModeration = false;
    this.headerInterface?.unsubscribe();
    this._deviceSub?.unsubscribe();
    this._commentsSub?.unsubscribe();
  }

  ngOnInit() {
    this.roomDataFilterService.currentFilter = RoomDataFilter.loadFilter('moderatorList');
    this.roomDataFilterService.isModeration = true;
    this.initNavigation();
    this.authenticationService.watchUser.subscribe(user => {
      if (!user) {
        return;
      }
      this.user = user;
    });
    this.userRole = this.user.role;
    this.sessionService.getRoomOnce().subscribe(room => this.room = room);
    this.translateService.use(localStorage.getItem('currentLang'));
    this.sessionService.getModeratorsOnce()
      .subscribe(mods => this.moderatorAccountIds = new Set<string>(mods.map(m => m.accountId)));
    this._commentsSub = this.roomDataFilterService.getData().subscribe(_ => this.onRefreshFiltering());
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
    const filter = this.roomDataFilterService.currentFilter;
    filter.currentSearch = this.searchString;
    this.roomDataFilterService.currentFilter = filter;
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
    const filter = this.roomDataFilterService.currentFilter;
    filter.currentSearch = '';
    this.roomDataFilterService.currentFilter = filter;
  }

  getVote(comment: Comment): Vote {
    if (this.userRole === 0) {
      return this.commentVoteMap.get(comment.id);
    }
  }

  onRefreshFiltering(): void {
    const result = this.roomDataFilterService.currentData;
    this.comments = result.comments;
    this.commentsFilteredByTimeLength = result.timeFilteredCount;
    this.isLoading = false;
    if (this.firstReceive && this.comments.length > 0) {
      this.firstReceive = false;
      if (this.roomDataFilterService.currentFilter.currentSearch) {
        this.search = true;
      }
    }
    this.commentsWrittenByUsers.clear();
    for (const comment of this.comments) {
      let set = this.commentsWrittenByUsers.get(comment.creatorId);
      if (!set) {
        set = new Set<string>();
        this.commentsWrittenByUsers.set(comment.creatorId, set);
      }
      set.add(comment.id);
    }
    const filter = this.roomDataFilterService.currentFilter;
    this.filterType = filter.filterType;
    this.sortType = filter.sortType;
    this.sortReverse = filter.sortReverse;
    this.period = filter.period;
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
    const filter = this.roomDataFilterService.currentFilter;
    if (period) {
      filter.period = period;
      filter.fromNow = null;
    }
    this.roomDataFilterService.currentFilter = filter;
  }
}
