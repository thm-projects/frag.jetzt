import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommentService } from '../../../../services/http/comment.service';
import { Comment } from '../../../../models/comment';
import { WsCommentService } from '../../../../services/websockets/ws-comment.service';
import { ColComponent } from '../../../../../../projects/ars/src/lib/components/layout/frame/col/col.component';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { LanguageService } from '../../../../services/util/language.service';
import { TranslateService } from '@ngx-translate/core';
import { Rescale } from '../../../../models/rescale';
import { QuestionWallKeyEventSupport } from '../QuestionWallKeyEventSupport';
import { MatSliderChange } from '@angular/material/slider';
import { RoomDataService } from '../../../../services/util/room-data.service';
import { User } from '../../../../models/user';
import { UserRole } from '../../../../models/user-roles.enum';
import { SessionService } from '../../../../services/util/session.service';
import { Room } from '../../../../models/room';
import { mergeMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import {
  IntroductionQuestionWallComponent
} from '../../_dialogs/introductions/introduction-question-wall/introduction-question-wall.component';
import { FilterType, Period, PeriodKey, SortType } from '../../../../utils/data-filter-object.lib';
import { DataFilterObject } from '../../../../utils/data-filter-object';
import { ArsDateFormatter } from '../../../../../../projects/ars/src/lib/services/ars-date-formatter.service';


interface CommentCache {
  [commentId: string]: {
    old: boolean;
    timeAgo: string;
    date: Date;
  };
}

const TIME_FORMAT_DE: [string, string][] =
  [
    ['vor % Jahr', 'vor % Jahren'],
    ['vor % Monat', 'vor % Monaten'],
    ['vor % Tag', 'vor % Tagen'],
    ['vor % Stunde', 'vor % Stunden'],
    ['vor % Minute', 'vor % Minuten'],
    ['vor % Sekunde', 'vor % Sekunden']
  ];

const TIME_FORMAT_EN: [string, string][] = [
  ['% year ago', '% years ago'],
  ['% month ago', '% months ago'],
  ['% day ago', '% days ago'],
  ['% hour ago', '% hours ago'],
  ['% minute ago', '% minutes ago'],
  ['% second ago', '% seconds ago'],
];

let currentTimeFormat: [string, string][] = TIME_FORMAT_EN;

const calcTime = (time: number, format: [string, string]): string => {
  if (time < 1) {
    return null;
  }
  return format[time === 1 ? 0 : 1].replace('%', String(time));
};

const estimatedMonthDuration = 365.25 / 12;

const updateTimeAgo = (currentTime: number, dateTime: number): string => {
  const seconds = Math.floor((currentTime - dateTime) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / estimatedMonthDuration);
  const years = Math.floor(months / 12);
  return calcTime(years, currentTimeFormat[0]) ||
    calcTime(months, currentTimeFormat[1]) ||
    calcTime(days, currentTimeFormat[2]) ||
    calcTime(hours, currentTimeFormat[3]) ||
    calcTime(minutes, currentTimeFormat[4]) ||
    calcTime(seconds, currentTimeFormat[5]) ||
    currentTimeFormat[5][0].replace('%', '1');
};

@Component({
  selector: 'app-question-wall',
  templateUrl: './question-wall.component.html',
  styleUrls: ['./question-wall.component.scss']
})
export class QuestionWallComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(ColComponent) colComponent: ColComponent;
  @ViewChild('sidelist') sidelist: ColComponent;

  sidelistExpanded = true;
  qrCodeExpanded = false;
  comments: Comment[] = [];
  commentFocus: Comment = null;
  commentFocusId: string = null;
  commentsCountQuestions = 0;
  commentsCountUsers = 0;
  unreadComments = 0;
  focusIncomingComments = true;
  timeUpdateInterval;
  keySupport: QuestionWallKeyEventSupport;
  filterTitle = '';
  filterDesc = '';
  filterIcon = '';
  isSvgIcon = false;
  userMap: Map<string, number> = new Map<string, number>();
  userList: [number, string][] = [];
  userSelection = false;
  fontSize = 180;
  periodsList = Object.values(Period) as PeriodKey[];
  isLoading = true;
  user: User;
  animationTrigger = true;
  firstPassIntroduction = true;
  room: Room = null;
  period: Period;
  private readonly commentCache: CommentCache = {};
  private _filterObj: DataFilterObject;

  constructor(
    private authenticationService: AuthenticationService,
    public router: Router,
    private commentService: CommentService,
    private wsCommentService: WsCommentService,
    private langService: LanguageService,
    private translateService: TranslateService,
    private roomDataService: RoomDataService,
    private sessionService: SessionService,
    private dialog: MatDialog,
    public dateFormatter: ArsDateFormatter,
  ) {
    this.keySupport = new QuestionWallKeyEventSupport();
    this.timeUpdateInterval = setInterval(() => {
      const current = new Date().getTime();
      this.comments.forEach(e => {
        const cacheEntry = this.commentCache[e.id];
        cacheEntry.timeAgo = updateTimeAgo(current, cacheEntry.date.getTime());
      });
    }, 15000);
    this.langService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
      currentTimeFormat = lang.toUpperCase() === 'DE' ? TIME_FORMAT_DE : TIME_FORMAT_EN;
    });
    this._filterObj = new DataFilterObject('presentation', this.roomDataService,
      this.authenticationService, this.sessionService, { ignoreRoleSort: true, sortType: SortType.Score });
  }

  get hasFilter() {
    return !!this._filterObj.filter.filterType;
  }

  public wrap<E>(e: E, action: (e: E) => void) {
    action(e);
  }

  public notUndefined<E>(e: E, action: (e: E) => void, elsePart?: () => void) {
    if (e) {
      action(e);
    } else if (elsePart) {
      elsePart();
    }
  }

  toggleSideList() {
    this.sidelistExpanded = !this.sidelistExpanded;
    if (this.sidelistExpanded) {
      this.sidelist.setPx(450);
    } else {
      this.sidelist.setPx(0);
    }
  }

  getURL() {
    const room = this.sessionService.currentRoom;
    if (!room) {
      return '';
    }
    return `${window.location.protocol}//${window.location.hostname}/participant/room/${room.shortId}`;
  }

  toggleQRCode() {
    this.qrCodeExpanded = !this.qrCodeExpanded;
  }

  ngOnInit(): void {
    this.authenticationService.watchUser.subscribe(newUser => {
      if (newUser) {
        this.user = newUser;
      }
    });
    this._filterObj.subscribe(() => this.onUpdateFiltering());
    this.sessionService.getRoomOnce().pipe(mergeMap(_ => this.roomDataService.receiveUpdates([
      { type: 'CommentCreated' }
    ]))).subscribe(c => {
      if (c.finished) {
        if (this.focusIncomingComments) {
          this.focusComment(c.comment);
        }
        return;
      }
      this.unreadComments++;
      const date = new Date(c.comment.createdAt);
      this.commentCache[c.comment.id] = {
        date,
        old: false,
        timeAgo: updateTimeAgo(new Date().getTime(), date.getTime())
      };
    });
    this.sessionService.getRoomOnce().subscribe(room => this.room = room);
    this.initKeySupport();
  }

  initKeySupport() {
    this.wrap(this.keySupport, key => {
      key.addKeyEvent('ArrowRight', () => this.nextComment());
      key.addKeyEvent('ArrowLeft', () => this.prevComment());
      key.addKeyEvent('ArrowDown', () => this.nextComment());
      key.addKeyEvent('ArrowUp', () => this.prevComment());
      key.addKeyEvent('l', () => this.toggleSideList());
      key.addKeyEvent('q', () => this.toggleQRCode());
    });
  }

  ngAfterViewInit(): void {
    document.getElementById('header_rescale').style.display = 'none';
    document.getElementById('footer_rescale').style.display = 'none';
    setTimeout(() => {
      Rescale.requestFullscreen();
    }, 10);
    setTimeout(() => {
      Array.from(document.getElementsByClassName('questionwall-screen')[0].getElementsByTagName('button')).forEach(e => {
        e.addEventListener('keydown', e1 => {
          e1.preventDefault();
        });
      });
    }, 100);
  }

  ngOnDestroy(): void {
    this._filterObj.unload();
    this.keySupport.destroy();
    window.clearInterval(this.timeUpdateInterval);
    document.getElementById('header_rescale').style.display = 'block';
    document.getElementById('footer_rescale').style.display = 'block';
    Rescale.exitFullscreen();
  }

  getTimeAgo(commentId: string): string {
    return this.commentCache[commentId].timeAgo;
  }

  isOld(commentId: string): boolean {
    return this.commentCache[commentId].old;
  }

  nextComment() {
    this.moveComment(1);
  }

  prevComment() {
    this.moveComment(-1);
  }

  getDOMComments() {
    return Array.from(document.getElementsByClassName('questionwall-comment-anchor'));
  }

  getDOMCommentFocus() {
    return this.getDOMComments()[this.getCommentFocusIndex()];
  }

  getCommentFocusIndex() {
    return this.comments.findIndex(c => c.id === this.commentFocusId);
  }

  moveComment(fx: number) {
    if (!this.comments.length) {
      return;
    }
    if (!this.commentFocusId) {
      this.focusComment(this.comments[0]);
      return;
    }
    const cursor = this.getCommentFocusIndex();
    if (cursor + fx >= this.comments.length || cursor + fx < 0) {
      return;
    } else {
      this.focusComment(this.comments[cursor + fx]);
    }
  }

  focusComment(comment: Comment) {
    this.firstPassIntroduction = false;
    if (this.commentFocusId === comment.id) {
      return;
    }
    this.commentFocusId = null;
    this.commentFocus = null;
    setTimeout(() => {
      this.commentFocusId = comment.id;
      this.commentFocus = comment;
      const entry = this.commentCache[comment.id];
      if (!entry.old) {
        entry.old = true;
        this.unreadComments--;
      }
      this.getDOMCommentFocus().scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 1);
  }

  toggleFocusIncomingComments() {
    this.focusIncomingComments = !this.focusIncomingComments;
  }

  applyUserMap(user: string) {
    this.userSelection = false;
    this.filterUserByNumber(user);
  }

  openUserMap() {
    if (this.userSelection) {
      return;
    }
    this.userSelection = true;
  }

  cancelUserMap() {
    this.userSelection = false;
    this.deactivateFilter();
  }

  leave() {
    const resolveUserRole: () => string = () => {
      switch (this.user ? this.user.role : -1) {
        case UserRole.PARTICIPANT:
          return 'participant';
        case UserRole.EDITING_MODERATOR:
          return 'moderator';
        case UserRole.EXECUTIVE_MODERATOR:
          return 'moderator';
        case UserRole.CREATOR:
          return 'creator';
        default:
          return 'participant';
      }
    };
    this.router.navigate(['/' + resolveUserRole() + '/room/' + this.sessionService.currentRoom.shortId + '/comments']);
  }

  likeComment(comment: Comment) {
    this.commentService.voteUp(comment, this.user.id).subscribe();
  }

  dislikeComment(comment: Comment) {
    this.commentService.voteDown(comment, this.user.id).subscribe();
  }

  sortScore(reverse?: boolean) {
    this.sort(SortType.Score, reverse);
  }

  sortTime(reverse?: boolean) {
    this.sort(SortType.Time, reverse);
  }

  sortControversy(reverse?: boolean) {
    this.sort(SortType.Controversy, reverse);
  }

  sort(sortType: SortType, reverse?: boolean) {
    const filter = this._filterObj.filter;
    filter.sortType = sortType;
    filter.sortReverse = Boolean(reverse);
    this._filterObj.filter = filter;
  }

  filterFavorites() {
    this.filterIcon = 'grade';
    this.isSvgIcon = false;
    this.filterTitle = 'question-wall.filter-favorite';
    this.filterDesc = '';
    const filter = this._filterObj.filter;
    filter.filterCompare = null;
    filter.filterType = FilterType.Favorite;
    this._filterObj.filter = filter;
  }

  filterUser(comment: Comment) {
    this.filterUserByNumber(comment.creatorId);
  }

  filterUserByNumber(user: string) {
    this.filterIcon = 'person_pin_circle';
    this.isSvgIcon = false;
    this.filterTitle = 'question-wall.filter-user';
    this.filterDesc = '';
    const filter = this._filterObj.filter;
    filter.filterCompare = user;
    filter.filterType = FilterType.CreatorId;
    this._filterObj.filter = filter;
  }

  filterBookmark() {
    this.filterIcon = 'bookmark';
    this.isSvgIcon = false;
    this.filterTitle = 'question-wall.filter-bookmark';
    this.filterDesc = '';
    const filter = this._filterObj.filter;
    filter.filterCompare = null;
    filter.filterType = FilterType.Bookmark;
    this._filterObj.filter = filter;
  }

  filterTag(tag: string) {
    this.filterIcon = 'sell';
    this.isSvgIcon = false;
    this.filterTitle = '';
    this.filterDesc = tag;
    const filter = this._filterObj.filter;
    filter.filterCompare = tag;
    filter.filterType = FilterType.Tag;
    this._filterObj.filter = filter;
  }

  deactivateFilter() {
    const filter = this._filterObj.filter;
    filter.filterType = null;
    filter.filterCompare = null;
    this._filterObj.filter = filter;
  }

  sliderChange(evt: MatSliderChange) {
    this.fontSize = evt.value;
  }

  openSiteIntroduction() {
    this.dialog.open(IntroductionQuestionWallComponent, {
      autoFocus: false
    });
  }

  onUpdateFiltering() {
    const result = this._filterObj.currentData;
    this.comments = result.comments.filter(c => c.commentReference === null);
    const filter = this._filterObj.filter;
    this.period = filter.period;
    this.isLoading = false;
    const current = new Date().getTime();
    const tempUserSet = new Set<string>();
    this.comments.forEach(comment => {
      tempUserSet.add(comment.creatorId);
      if (this.commentCache[comment.id]) {
        return;
      }
      const date = new Date(comment.createdAt);
      this.commentCache[comment.id] = {
        date,
        old: true,
        timeAgo: updateTimeAgo(current, date.getTime())
      };
    });
    this.refreshUserMap();
    this.commentsCountQuestions = this.comments.length;
    this.commentsCountUsers = tempUserSet.size;
    this.animationTrigger = false;
    setTimeout(() => {
      this.animationTrigger = true;
      if (this.comments.length < 1 || !this.comments.some(c => c.id === this.commentFocusId)) {
        this.commentFocusId = null;
      }
    });
  }

  setTimePeriod(period: PeriodKey) {
    const filter = this._filterObj.filter;
    filter.period = Period[period];
    this._filterObj.filter = filter;
  }

  getCommentIcon(comment: Comment): string {
    const isFromOwner = this.room.ownerId === comment?.creatorId;
    let isFromModerator = false;
    this.sessionService.getModeratorsOnce()
      .subscribe(mods => isFromModerator = mods.some(mod => mod.accountId === comment?.creatorId));
    if (comment?.brainstormingQuestion) {
      return 'psychology_alt';
    } else if (isFromOwner) {
      return 'co_present';
    } else if (isFromModerator) {
      return 'gavel';
    }
    return 'person';
  }

  getCommentIconClass(comment: Comment): string {
    const isFromOwner = this.room.ownerId === comment?.creatorId;
    let isFromModerator = false;
    this.sessionService.getModeratorsOnce()
      .subscribe(mods => isFromModerator = mods.some(mod => mod.accountId === comment?.creatorId));
    if (comment?.brainstormingQuestion || isFromOwner || isFromModerator) {
      return '';
    }
    return 'material-icons-outlined';
  }

  generateCommentNumber(comment: Comment): string {
    if (!comment?.number) {
      return;
    }
    const meta = comment.number.split('/');
    const topLevelNumber = meta[0];
    const number = meta[meta.length - 1];
    let message = '';
    if (meta.length === 1) {
      this.translateService.get('comment-list.question-number', { number })
        .subscribe(msg => message = msg.split('/'));
      return message;
    }
    this.translateService.get('comment-list.comment-number', {
      topLevelNumber,
      number,
      level: meta.length - 1,
    }).subscribe(msg => message = msg.split('/'));
    return message;
  }

  private refreshUserMap() {
    this.userMap.clear();
    this.comments.forEach(comment => {
      this.userMap.set(comment.creatorId, (this.userMap.get(comment.creatorId) || 0) + 1);
    });
    this.userList.length = 0;
    this.userMap.forEach((num, user) => {
      this.userList.push([num, user]);
    });
  }

}
