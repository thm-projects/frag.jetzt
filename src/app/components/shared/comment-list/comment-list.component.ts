import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { Message } from '@stomp/stompjs';
import { CreateCommentComponent } from '../_dialogs/create-comment/create-comment.component';
import { MatDialog } from '@angular/material';
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
import { Subscription } from 'rxjs';
import { AppComponent } from '../../../app.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit, OnDestroy {
  @ViewChild('searchBox') searchField: ElementRef;
  @Input() user: User;
  @Input() roomId: string;
  AppComponent = AppComponent;
  comments: Comment[] = [];
  room: Room;
  hideCommentsList = false;
  filteredComments: Comment[];
  userRole: UserRole;
  deviceType: string;
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
  tag = 'tag';
  currentFilter = '';
  commentVoteMap = new Map<string, Vote>();
  scroll = false;
  scrollExtended = false;
  searchInput = '';
  search = false;
  searchPlaceholder = '';
  moderationEnabled = false;
  thresholdEnabled = false;
  newestComment: string;
  freeze = false;
  commentStream: Subscription;

  constructor(private commentService: CommentService,
              private translateService: TranslateService,
              public dialog: MatDialog,
              protected langService: LanguageService,
              private wsCommentService: WsCommentServiceService,
              protected roomService: RoomService,
              protected voteService: VoteService,
              private notificationService: NotificationService,
              public eventService: EventService,
              public liveAnnouncer: LiveAnnouncer,
              private router: Router
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.roomId = localStorage.getItem(`roomId`);
    const userId = this.user.id;
    this.userRole = this.user.role;
    this.currentSort = this.votedesc;
    this.roomService.getRoom(this.roomId).subscribe( room => {
      this.room = room;
      if (this.room && this.room.extensions && this.room.extensions['comments']) {
        if (this.room.extensions['comments'].enableModeration !== null) {
          this.moderationEnabled = this.room.extensions['comments'].enableModeration;
        }
      }
      this.commentService.getAckComments(this.roomId)
        .subscribe(comments => {
          this.comments = comments;
          this.getComments();
        });
      if (this.userRole === UserRole.PARTICIPANT) {
        this.openCreateDialog();
      }
    });
    this.hideCommentsList = false;
    this.subscribeCommentStream();
    this.translateService.use(localStorage.getItem('currentLang'));
    this.deviceType = localStorage.getItem('deviceType');
    if (this.userRole === 0) {
      this.voteService.getByRoomIdAndUserID(this.roomId, userId).subscribe(votes => {
        for (const v of votes) {
          this.commentVoteMap.set(v.commentId, v);
        }
      });
    }
    this.translateService.get('comment-list.search').subscribe(msg => {
      this.searchPlaceholder = msg;
    });
  }

  ngOnDestroy() {
    if (!this.freeze && this.commentStream) {
      this.commentStream.unsubscribe();
    }
  }

  checkScroll(): void {
    const currentScroll = document.documentElement.scrollTop;
    this.scroll = currentScroll >= 65;
    this.scrollExtended = currentScroll >= 300;
  }

  isScrollButtonVisible(): boolean {
    return !AppComponent.isScrolledTop() && this.comments.length > 5;
  }

  searchComments(): void {
    if (this.searchInput) {
      if (this.searchInput.length > 2) {
        this.hideCommentsList = true;
        this.filteredComments = this.comments.filter(c => c.body.toLowerCase().includes(this.searchInput.toLowerCase()));
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
    if (this.room && this.room.extensions && this.room.extensions['comments']) {
      if (this.room.extensions['comments'].enableThreshold) {
        this.thresholdEnabled = true;
      } else {
        this.thresholdEnabled = false;
      }
    }
    this.isLoading = false;
    let commentThreshold;
    if (this.thresholdEnabled) {
      commentThreshold = this.room.extensions['comments'].commentThreshold;
      if (this.hideCommentsList) {
        this.filteredComments = this.filteredComments.filter( x => x.score >= commentThreshold );
      } else {
        this.comments = this.comments.filter( x => x.score >= commentThreshold );
      }
    }
    this.sortComments(this.currentSort);
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

        this.announceNewComment(c.body);

        this.comments = this.comments.concat(c);
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
                  }
                  break;
                case this.tag:
                  this.comments[i].tag = <string>value;
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
    this.filterComments(this.currentFilter);
    this.sortComments(this.currentSort);
    this.searchComments();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateCommentComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.user = this.user;
    dialogRef.componentInstance.roomId = this.roomId;
    dialogRef.componentInstance.tags = this.room.extensions['tags'].tags;
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
    if (this.moderationEnabled) {
      if (this.userRole === 1 || this.userRole === 3) {
        this.translateService.get('comment-list.comment-sent').subscribe(msg => {
          message = msg;
        });
        comment.ack = true;
      } else {
        this.translateService.get('comment-list.comment-sent-to-moderator').subscribe( msg => {
          message = msg;
        });
      }
    } else {
      this.translateService.get('comment-list.comment-sent').subscribe(msg => {
        message = msg;
      });
    }
    this.wsCommentService.add(comment);
    this.notificationService.show(message);
  }

  filterComments(type: string, tag?: string): void {
    this.currentFilter = type;
    if (type === '') {
      this.filteredComments = this.comments;
      this.hideCommentsList = false;
      this.currentFilter = '';
      return;
    }
    this.filteredComments = this.comments.filter(c => {
      switch (type) {
        case this.correct:
          return c.correct === CorrectWrong.CORRECT ? 1 : 0;
        case this.wrong:
          return c.correct === CorrectWrong.WRONG ? 1 : 0;
        case this.favorite:
          return c.favorite;
        case this.read:
          return c.read;
        case this.unread:
          return !c.read;
        case this.tag:
          return c.tag === tag;
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
      this.comments = this.sort(this.comments, type);
    }
    this.currentSort = type;
  }

  clickedOnTag(tag: string): void {
    this.filterComments(this.tag, tag);
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
        this.comments = comments;
        this.getComments();
      });
    this.subscribeCommentStream();
    this.translateService.get('comment-list.comment-stream-started').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  subscribeCommentStream() {
    this.commentStream = this.wsCommentService.getCommentStream(this.roomId).subscribe((message: Message) => {
      this.parseIncomingMessage(message);
    });
  }

  switchToModerationList(): void {
    this.router.navigate([`/moderator/room/${this.room.shortId}/moderator/comments`]);
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
}
