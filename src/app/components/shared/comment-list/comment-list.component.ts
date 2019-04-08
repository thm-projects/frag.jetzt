import { Component, Input, OnInit } from '@angular/core';
import { Comment } from '../../../models/comment';
import { CommentService } from '../../../services/http/comment.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { Message } from '@stomp/stompjs';
import { SubmitCommentComponent } from '../_dialogs/submit-comment/submit-comment.component';
import { MatDialog } from '@angular/material';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit {
  @Input() user: User;
  @Input() roomId: string;
  room: Room;
  comments: Comment[];
  isLoading = true;
  hideCommentsList: boolean;
  isIconHide: boolean;
  filteredComments: Comment[];
  userRole: UserRole;

  constructor(private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected langService: LanguageService,
    private wsCommentService: WsCommentServiceService,
    private authenticationService: AuthenticationService,
    private wsCommentService: WsCommentServiceService,
    protected roomService: RoomService
  ) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.roomId = localStorage.getItem(`roomId`);
    this.roomService.getRoom(this.roomId).subscribe( room => this.room = room);
    this.comments = [];
    this.hideCommentsList = false;
    this.wsCommentService.getCommentStream(this.roomId).subscribe((message: Message) => {
      this.parseIncomingMessage(message);
    });
    this.getComments();
    this.translateService.use(localStorage.getItem('currentLang'));
    this.userRole = this.authenticationService.getRole();

  }

  getComments(): void {
    this.commentService.getComments(this.roomId)
      .subscribe(comments => {
        this.comments = comments;
        this.isLoading = false;
      });
  }

  searchComments(term: string): void {
    if (term && term.length > 2) {
      this.hideCommentsList = true;
      this.filteredComments = this.comments.filter(c => c.body.toLowerCase().includes(term.toLowerCase()));
    } else {
      this.hideCommentsList = false;
    }
  }

  getCommentsCreator(): Comment[] {
    // ToDo: get a default comment threshold from config settings file
    let commentThreshold = -10;
    if (
      (this.room.extensions.get('comments') != null) &&
      (this.room.extensions.get('comments').get('commentThreshold'))
    ) {
      commentThreshold = this.room.extensions.get('comments').get('commentThreshold');
    }
    if (this.hideCommentsList) {
      return this.filteredComments.filter( x => x.score >= commentThreshold );
    } else {
      return  this.comments.filter( x => x.score >= commentThreshold );
    }
  }

  getCommentsParticipant(): Comment[] {
    if ( this.hideCommentsList) {
      return this.filteredComments;
    } else {
      return this.comments;
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
        c.creationTimestamp = payload.timestamp;
        this.comments = this.comments.concat(c);
        break;
      case 'CommentPatched':
        // ToDo: Use a map for comments w/ key = commentId
        for (let i = 0; i < this.comments.length; i++) {
          if (payload.id === this.comments[i].id) {
            for (const [key, value] of Object.entries(payload.changes)) {
              switch (key) {
                case 'read':
                  this.comments[i].read = <boolean>value;
                  break;
                case 'correct':
                  this.comments[i].correct = <boolean>value;
                  break;
                case 'favorite':
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
            console.log(<boolean>payload.lights);
            console.log(this.comments[i]);
          }
        }
        break;
    }
  }

  openSubmitDialog(): void {
    const dialogRef = this.dialog.open(SubmitCommentComponent, {
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

  export(clicked: boolean): void {
    this.commentService.exportButtonClicked(clicked);
  }

  filterFavorite(): void {
    this.filteredComments = this.comments.filter(c => c.favorite);
  }

  filterMarkAsRead(): void {
    this.filteredComments = this.comments.filter(c => c.read);
  }

  filterMarkAsCorrect(): void {
    this.filteredComments = this.comments.filter(c => c.correct);
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

  sortTimeStamp(): void {
    this.comments.sort((a, b) => {
      const dateA = new Date(a.timestamp), dateB = new Date(b.timestamp);
      return +dateB - +dateA;
    });
  }
}
