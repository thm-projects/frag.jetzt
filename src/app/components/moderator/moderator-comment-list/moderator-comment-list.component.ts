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
import { PageEvent } from '@angular/material/paginator';
import {
  CommentListFilter,
  FilterType,
  FilterTypeKey, Period,
  SortType,
  SortTypeKey
} from '../../shared/comment-list/comment-list.filter';
import { ModeratorService } from '../../../services/http/moderator.service';


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
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];
  showFirstLastButtons = true;
  commentsWrittenByUsers: Map<string, Set<string>> = new Map<string, Set<string>>();
  filter: CommentListFilter;

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
    private bonusTokenService: BonusTokenService,
    private moderationService: ModeratorService
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
    this.filter = CommentListFilter.loadCurrentFilter();
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

  ngOnDestroy() {
    this.filter.save();
    if (this.headerInterface) {
      this.headerInterface.unsubscribe();
    }
  }

  ngOnInit() {
    this.initNavigation();
    this.roomId = localStorage.getItem(`roomId`);
    const userId = this.user.id;
    this.filter.updateUserId(userId);
    this.userRole = this.user.role;
    this.roomService.getRoom(this.roomId).subscribe(room => {
      this.room = room;
      this.filter.updateRoom(room);
    });
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
    this.moderationService.get(this.roomId)
      .subscribe((mods) => {
        this.filter.updateModerators(mods.map(mod => mod.accountId));

        this.commentService.getRejectedComments(this.roomId)
          .subscribe(comments => {
            this.comments = comments;
            this.setTimePeriod(this.filter.period);
            this.isLoading = false;
          });
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
    return !AppComponent.isScrolledTop() && this.commentsFilteredByTime.length > 10;
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
    this.translateService.get('comment-list.search').subscribe(msg => {
      this.searchPlaceholder = msg;
    });
    this.search = true;
    this.searchField.nativeElement.focus();
  }

  abortSearch() {
    this.hideCommentsList = false;
    this.filter.currentSearch = '';
    this.search = false;
    this.refreshFiltering();
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
    this.setTimePeriod(this.filter.period);
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
                  this.setTimePeriod(this.filter.period);
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
    this.setTimePeriod(this.filter.period);
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
    this.setTimePeriod(this.filter.period);
    if (this.hideCommentsList) {
      this.searchComments();
    }
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
    if (this.search) {
      this.filteredComments = this.filter.filterCommentsBySearch(this.comments);
      return;
    }
    this.commentsFilteredByTime = this.filter.filterCommentsByTime(this.comments);
    this.hideCommentsList = !!this.filter.filterType;
    this.filteredComments = this.hideCommentsList ?
      this.filter.filterCommentsByType(this.commentsFilteredByTime) : this.commentsFilteredByTime;
    this.filter.sortCommentsBySortType(this.filteredComments);
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
      this.filter.period = period;
      this.filter.fromNow = null;
    }
    this.refreshFiltering();
  }
}
