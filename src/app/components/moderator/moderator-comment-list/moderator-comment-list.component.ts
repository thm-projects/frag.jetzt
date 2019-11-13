import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { Message } from '@stomp/stompjs';
import { MatDialog } from '@angular/material';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { User } from '../../../models/user';
import { Vote } from '../../../models/vote';
import { UserRole } from '../../../models/user-roles.enum';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { VoteService } from '../../../services/http/vote.service';
import { CorrectWrong } from '../../../models/correct-wrong.enum';
import { EventService } from '../../../services/util/event.service';
import { Router } from '@angular/router';
import { AppComponent } from '../../../app.component';

@Component({
  selector: 'app-moderator-comment-list',
  templateUrl: './moderator-comment-list.component.html',
  styleUrls: ['./moderator-comment-list.component.scss']
})
export class ModeratorCommentListComponent implements OnInit {
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
  currentFilter = '';
  commentVoteMap = new Map<string, Vote>();
  scroll = false;
  scrollExtended = false;
  searchInput = '';
  search = false;
  searchPlaceholder = '';

  constructor(
    private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected langService: LanguageService,
    private wsCommentService: WsCommentServiceService,
    protected roomService: RoomService,
    public eventService: EventService,
    private router: Router
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.roomId = localStorage.getItem(`roomId`);
    const userId = this.user.id;
    this.userRole = this.user.role;
    this.roomService.getRoom(this.roomId).subscribe(room => this.room = room);
    this.hideCommentsList = false;
    this.wsCommentService.getModeratorCommentStream(this.roomId).subscribe((message: Message) => {
      this.parseIncomingModeratorMessage(message);
    });
    this.wsCommentService.getCommentStream(this.roomId).subscribe((message: Message) => {
      this.parseIncomingMessage(message);
    });
    this.translateService.use(localStorage.getItem('currentLang'));
    this.deviceType = localStorage.getItem('deviceType');
    this.currentSort = this.votedesc;
    this.commentService.getRejectedComments(this.roomId)
      .subscribe(comments => {
        this.comments = comments;
        this.isLoading = false;
        this.sortComments(this.currentSort);
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
    return !AppComponent.isScrolledTop() && this.comments.length > 5;
  }

  searchComments(): void {
    if (this.searchInput && this.searchInput.length > 2) {
      this.hideCommentsList = true;
      this.filteredComments = this.comments.filter(c => c.body.toLowerCase().includes(this.searchInput.toLowerCase()));
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
    this.isLoading = false;
    let commentThreshold = -10;
    if (this.room && this.room.extensions && this.room.extensions['comments']) {
      commentThreshold = this.room.extensions['comments'].commentThreshold;
      if (this.hideCommentsList) {
        this.filteredComments = this.filteredComments.filter(x => x.score >= commentThreshold);
      } else {
        this.comments = this.comments.filter(x => x.score >= commentThreshold);
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
                  case 'score':
                    this.comments[i].score = <number>value;
                    break;
                  case this.ack:
                    // tslint:disable-next-line:no-shadowed-variable
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

    this.filterComments(this.currentFilter);
    this.sortComments(this.currentSort);
    this.searchComments();
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
        this.comments = this.comments.concat(c);
        break;
    }
    this.filterComments(this.currentFilter);
    this.sortComments(this.currentSort);
    this.searchComments();
  }

  filterComments(type: string): void {
    this.currentFilter = type;
    if (type === '') {
      this.filteredComments = this.comments;
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
      }
    });
    this.sortComments(this.currentSort);
  }

  sort(array: any[], type: string): void {
    array.sort((a, b) => {
      if (type === this.voteasc) {
        return (a.score > b.score) ? 1 : (b.score > a.score) ? -1 : 0;
      } else if (type === this.votedesc) {
        return (b.score > a.score) ? 1 : (a.score > b.score) ? -1 : 0;
      }
      const dateA = new Date(a.timestamp), dateB = new Date(b.timestamp);
      if (type === this.time) {
        return (+dateB > +dateA) ? 1 : (+dateA > +dateB) ? -1 : 0;
      }
    });
  }

  sortComments(type: string): void {
    if (this.hideCommentsList === true) {
      this.sort(this.filteredComments, type);
    } else {
      this.sort(this.comments, type);
    }
    this.currentSort = type;
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
}
