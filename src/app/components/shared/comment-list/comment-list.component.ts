import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { Message } from '@stomp/stompjs';
import { CreateCommentComponent } from '../_dialogs/create-comment/create-comment.component';
import { MatDialog } from '@angular/material/dialog';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
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
import { Observable, Subscription } from 'rxjs';
import { AppComponent } from '../../../app.component';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { Title } from '@angular/platform-browser';
import { TitleService } from '../../../services/util/title.service';

export enum Period {
  ONEHOUR = 'time-1h',
  THREEHOURS = 'time-3h',
  ONEDAY = 'time-1d',
  ONEWEEK = 'time-1w',
  TWOWEEKS = 'time-2w',
  ALL = 'time-all'
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
  tag = 'tag';
  userNumber = 'userNumber';
  answer = 'answer';
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
  period: Period = Period.TWOWEEKS;

  constructor(
    private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected langService: LanguageService,
    private wsCommentService: WsCommentServiceService,
    protected roomService: RoomService,
    protected voteService: VoteService,
    private authenticationService: AuthenticationService,
    private notificationService: NotificationService,
    public eventService: EventService,
    public liveAnnouncer: LiveAnnouncer,
    private route: ActivatedRoute,
    private router: Router,
    private titleService: TitleService,
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
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
      this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(r => {
        this.roomService.getRoomByShortId(this.shortId).subscribe(room => {
          this.room = room;
          this.roomId = room.id;
          this.moderationEnabled = this.room.moderated;
          this.directSend = this.room.directSend;
          localStorage.setItem('moderationEnabled', JSON.stringify(this.moderationEnabled));
          if (!this.authenticationService.hasAccess(this.shortId, UserRole.PARTICIPANT)) {
            this.roomService.addToHistory(this.room.id);
            this.authenticationService.setAccess(this.shortId, UserRole.PARTICIPANT);
          }
          this.subscribeCommentStream();
          this.commentService.getAckComments(this.room.id)
            .subscribe(comments => {
              this.comments = comments;
              this.getComments();
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
  }

  ngOnDestroy() {
    if (!this.freeze && this.commentStream) {
      this.commentStream.unsubscribe();
    }
    this.titleService.resetTitle();
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
        this.filteredComments = this.commentsFilteredByTime.filter(c => c.body.toLowerCase().includes(this.searchInput.toLowerCase()));
      }
    } else if (this.searchInput.length === 0 && this.currentFilter === '') {
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
    this.setTimePeriod(this.period);
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
      case 'CommentCreated':
        const c = new Comment();
        c.roomId = this.roomId;
        c.body = payload.body;
        c.id = payload.id;
        c.timestamp = payload.timestamp;
        c.tag = payload.tag;
        c.creatorId = payload.creatorId;
        c.userNumber = this.commentService.hashCode(c.creatorId);
        this.commentService.getComment(c.id).subscribe(e => {
          c.number = e.number;
        });

        this.announceNewComment(c.body);
        this.comments = this.comments.concat(c);
        this.setComments(this.comments);
        break;
      case 'CommentPatched':
        // ToDo: Use a map for comments w/ key = commentId
        for (let i = 0; i < this.comments.length; i++) {
          if (payload.id === this.comments[i].id) {
            for (const [key, value] of Object.entries(payload.changes)) {
              switch (key) {
                case this.read:
                  this.comments[i].read = <boolean>value;
                  break;
                case this.correct:
                  this.comments[i].correct = <CorrectWrong>value;
                  break;
                case this.favorite:
                  this.comments[i].favorite = <boolean>value;
                  if (this.user.id === this.comments[i].creatorId && <boolean>value) {
                    this.translateService.get('comment-list.comment-got-favorited').subscribe(ret => {
                      this.notificationService.show(ret);
                    });
                  }
                  break;
                case this.bookmark:
                  this.comments[i].bookmark = <boolean>value;
                  break;
                case 'score':
                  this.comments[i].score = <number>value;
                  this.getComments();
                  break;
                case this.ack:
                  const isNowAck = <boolean>value;
                  if (!isNowAck) {
                    this.comments = this.comments.filter(function (el) {
                      return el.id !== payload.id;
                    });
                    this.setTimePeriod(this.period);
                  }
                  break;
                case this.tag:
                  this.comments[i].tag = <string>value;
                  break;
                case this.answer:
                  this.comments[i].answer = <string>value;
                  break;
              }
            }
          }
        }
        break;
      case 'CommentHighlighted':
        // ToDo: Use a map for comments w/ key = commentId
        for (let i = 0; i < this.comments.length; i++) {
          if (payload.id === this.comments[i].id) {
            this.comments[i].highlighted = <boolean>payload.lights;
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
    this.setTimePeriod(this.period);
    if (this.hideCommentsList) {
      this.searchComments();
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateCommentComponent, {
      width: '900px',
      maxWidth: 'calc( 100% - 50px )',
      maxHeight: 'calc( 100vh - 50px )',
      autoFocus: false,
    });
    dialogRef.componentInstance.user = this.user;
    dialogRef.componentInstance.roomId = this.roomId;
    let tags;
    tags = [];
    if (this.room.tags) {
      tags = this.room.tags;
    }
    dialogRef.componentInstance.tags = tags;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result) {
          this.send(result);
        } else {
          return;
        }
      });
  }

  send(comment: Comment): void {
    let message;
    if (this.directSend) {
      this.translateService.get('comment-list.comment-sent').subscribe(msg => {
        message = msg;
      });
      comment.ack = true;
    } else {
      if (this.userRole === 1 || this.userRole === 2 || this.userRole === 3) {
        this.translateService.get('comment-list.comment-sent').subscribe(msg => {
          message = msg;
        });
        comment.ack = true;
      }
      if (this.userRole === 0) {
        this.translateService.get('comment-list.comment-sent-to-moderator').subscribe(msg => {
          message = msg;
        });
      }
    }
    this.commentService.addComment(comment).subscribe();
    this.notificationService.show(message);
  }

  filterComments(type: string, compare?: any): void {
    this.currentFilter = type;
    if (type === '') {
      this.filteredComments = this.commentsFilteredByTime;
      this.hideCommentsList = false;
      this.currentFilter = '';
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
          return c.tag === compare;
        case this.userNumber:
          return c.userNumber === compare;
        case this.answer:
          return c.answer;
        case this.owner:
          return c.creatorId === this.user.id;
      }
    });
    this.hideCommentsList = true;
    this.sortComments(this.currentSort);
  }

  sort(array: any[], type: string): any[] {
    return array.sort((a, b) => {
      if (type === this.voteasc) {
        return (a.score > b.score) ? 1 : (b.score > a.score) ? -1 : 0;
      } else if (type === this.votedesc) {
        return (b.score > a.score) ? 1 : (a.score > b.score) ? -1 : 0;
      } else if (type === this.time) {
        const dateA = new Date(a.timestamp), dateB = new Date(b.timestamp);
        return (+dateB > +dateA) ? 1 : (+dateA > +dateB) ? -1 : 0;
      }
    });
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

  clickedUserNumber(usrNumber: number): void {
    this.filterComments(this.userNumber, usrNumber);
  }

  pauseCommentStream() {
    this.freeze = true;
    this.commentStream.unsubscribe();
    this.translateService.get('comment-list.comment-stream-stopped').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  playCommentStream() {
    this.freeze = false;
    this.commentService.getAckComments(this.roomId)
      .subscribe(comments => {
        this.setComments(comments);
        this.getComments();
      });
    this.subscribeCommentStream();
    this.translateService.get('comment-list.comment-stream-started').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  subscribeCommentStream() {
    this.commentStream = this.wsCommentService.getCommentStream(this.room.id).subscribe((message: Message) => {
      this.parseIncomingMessage(message);
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

      this.liveAnnouncer.announce(newCommentText).catch(err => { /* TODO error handling */ });
    }, 450);
  }

  setTimePeriod(period: Period) {
    this.period = period;
    const currentTime = new Date();
    const hourInSeconds = 3600000;
    let periodInSeconds;
    if (period !== Period.ALL) {
      switch (period) {
        case Period.ONEHOUR:
          periodInSeconds = hourInSeconds;
          break;
        case Period.THREEHOURS:
          periodInSeconds = hourInSeconds * 2;
          break;
        case Period.ONEDAY:
          periodInSeconds = hourInSeconds * 24;
          break;
        case Period.ONEWEEK:
          periodInSeconds = hourInSeconds * 168;
          break;
        case Period.TWOWEEKS:
          periodInSeconds = hourInSeconds * 336;
          break;
      }
      this.commentsFilteredByTime = this.comments
        .filter(c => new Date(c.timestamp).getTime() >= (currentTime.getTime() - periodInSeconds));
    } else {
      this.commentsFilteredByTime = this.comments;
    }
    this.filterComments(this.currentFilter);
    this.titleService.attachTitle('(' + this.commentsFilteredByTime.length + ')');
  }
}
