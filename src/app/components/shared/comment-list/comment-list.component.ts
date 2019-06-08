import { Component, Input, OnInit } from '@angular/core';
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
import { AuthenticationService } from '../../../services/http/authentication.service';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { VoteService } from '../../../services/http/vote.service';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit {
  @Input() user: User;
  @Input() roomId: string;
  @Input() comments: Comment[];
  room: Room;
  hideCommentsList = false;
  filteredComments: Comment[];
  userRole: UserRole;
  deviceType: string;
  isLoading = true;
  voteasc = 'vote_asc';
  votedesc = 'vote_desc';
  timeasc = 'time_asc';
  timedesc = 'time_desc';
  currentSort = this.votedesc;
  read = 'read';
  unread = 'unread';
  favorite = 'favorite';
  correct = 'correct';
  currentFilter = '';
  commentVoteMap = new Map<string, Vote>();

  constructor(private commentService: CommentService,
              private translateService: TranslateService,
              public dialog: MatDialog,
              protected langService: LanguageService,
              private authenticationService: AuthenticationService,
              private wsCommentService: WsCommentServiceService,
              protected roomService: RoomService,
              protected voteService: VoteService
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.roomId = localStorage.getItem(`roomId`);
    const userId = this.authenticationService.getUser().id;
    this.voteService.getByRoomIdAndUserID(this.roomId, userId).subscribe(votes => {
      for (const v of votes) {
        this.commentVoteMap.set(v.commentId, v);
      }
    });
    this.roomService.getRoom(this.roomId).subscribe( room => this.room = room);
    this.hideCommentsList = false;
    this.wsCommentService.getCommentStream(this.roomId).subscribe((message: Message) => {
      this.parseIncomingMessage(message);
    });
    this.translateService.use(localStorage.getItem('currentLang'));
    this.userRole = this.authenticationService.getRole();
    this.deviceType = localStorage.getItem('deviceType');
  }

  searchComments(term: string): void {
    if (term && term.length > 2) {
      this.hideCommentsList = true;
      this.filteredComments = this.comments.filter(c => c.body.toLowerCase().includes(term.toLowerCase()));
    } else {
      this.hideCommentsList = false;
    }
  }

  showComments(): Comment[] {
    this.isLoading = false;
    let commentThreshold = -10;
    if (this.room.extensions && this.room.extensions['comments']) {
      commentThreshold = this.room.extensions['comments'].commentThreshold;
      if (this.hideCommentsList) {
        return this.filteredComments.filter( x => x.score >= commentThreshold );
      } else {
        this.sort(this.currentSort);
        return this.comments.filter( x => x.score >= commentThreshold );
      }
    } else {
      if (this.hideCommentsList) {
        return this.filteredComments;
      } else {
        this.sort(this.currentSort);
        return this.comments;
      }
    }
  }

  getVote(comment: Comment): Vote {
    return this.commentVoteMap.get(comment.id);
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
                  this.comments[i].correct = <boolean>value;
                  break;
                case this.favorite:
                  this.comments[i].favorite = <boolean>value;
                  break;
                case 'score':
                  this.comments[i].score = <number>value;
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
    this.filter(this.currentFilter);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateCommentComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.user = this.user;
    dialogRef.componentInstance.roomId = this.roomId;
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
    this.wsCommentService.add(comment);
  }

  filterFavorite(): void {
    this.filteredComments = this.comments.filter(c => c.favorite);
  }

  filterRead(): void {
    this.filteredComments = this.comments.filter(c => c.read);
  }

  filterUnread(): void {
    this.filteredComments = this.comments.filter(c => !c.read);
  }

  filterCorrect(): void {
    this.filteredComments = this.comments.filter(c => c.correct);
  }

  filter(type: string): void {
    this.currentFilter = type;
    switch (type) {
      case this.correct:
        this.filterCorrect();
        break;
      case this.favorite:
        this.filterFavorite();
        break;
      case this.read:
        this.filterRead();
        break;
      case this.unread:
        this.filterUnread();
    }
  }

  sort(type: string): void {
    this.currentSort = type;
    if (type === this.voteasc) {
      this.sortVote();
    } else if (type === this.votedesc) {
      this.sortVoteDesc();
    } else {
      this.sortTime(type);
    }
  }

  sortVote(): void {
    this.comments.sort((a, b) => {
      return a.score - b.score;
    });
  }

  sortVoteDesc(): void {
    this.comments.sort((a, b) => {
      return b.score - a.score;
    });
  }

  sortTime(type: string): void {
    this.comments.sort((a, b) => {
      const dateA = new Date(a.timestamp), dateB = new Date(b.timestamp);
      if (type === this.timedesc) {
        return +dateA - +dateB;
      } else {
        return +dateB - +dateA;
      }
    });
  }
}
