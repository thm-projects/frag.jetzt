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
import { UserRole } from '../../../models/user-roles.enum';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { CommentExportComponent } from '../../creator/_dialogs/comment-export/comment-export.component';
import { DeleteCommentComponent } from '../_dialogs/delete-comment/delete-comment.component';

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
  hideCommentsList = false;
  filteredComments: Comment[];
  userRole: UserRole;

  constructor(private commentService: CommentService,
    private translateService: TranslateService,
    public dialog: MatDialog,
    protected langService: LanguageService,
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

  showComments(): Comment[] {
    let commentThreshold = -10;
    if (this.room.extensions && this.room.extensions['comments']) {
      commentThreshold = this.room.extensions['comments'].commentThreshold;
      if (this.hideCommentsList) {
        return this.filteredComments.filter( x => x.score >= commentThreshold );
      } else {
        return this.comments.filter( x => x.score >= commentThreshold );
      }
    } else {
      if (this.hideCommentsList) {
        return this.filteredComments;
      } else {
        return this.comments;
      }
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

  openDeletionRoomDialog(): void {
    const dialogRef = this.dialog.open(DeleteCommentComponent, {
      width: '400px'
    });
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteComments();
        }
      });
  }

  send(comment: Comment): void {
    this.wsCommentService.add(comment);
  }

  exportCsv(delimiter: string, date: string): void {
    const exportComments = JSON.parse(JSON.stringify(this.comments));
    let csv: string;
    let keyFields = '';
    let valueFields = '';
    keyFields = Object.keys(exportComments[0]).slice(3).join(delimiter) + '\r\n';
    exportComments.forEach(element => {
      element.body = '"' + element.body.replace(/[\r\n]/g, ' ').replace(/ +/g, ' ').replace(/"/g, '""') + '"';
      valueFields += Object.values(element).slice(3).join(delimiter) + '\r\n';
    });
    csv = keyFields + valueFields;
    const myBlob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    const fileName = 'comments_' + date + '.csv';
    link.setAttribute('download', fileName);
    link.href = window.URL.createObjectURL(myBlob);
    link.click();
  }

  onExport(exportType: string): void {
    const date = new Date();
    const dateString = date.getFullYear() + '_' + ('0' + (date.getMonth() + 1)).slice(-2) + '_' + ('0' + date.getDate()).slice(-2);
    const timeString = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2) + ('0' + date.getSeconds()).slice(-2);
    const timestamp = dateString + '_' + timeString;
      if (exportType === 'comma') {
        this.exportCsv(',', timestamp);
      }
      if (exportType === 'semicolon') {
        this.exportCsv(';', timestamp);
      }
  }


  openExportDialog(): void {
    const dialogRef = this.dialog.open(CommentExportComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe(result => {
      this.onExport(result);
    });
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

  deleteComments(): void {
    this.commentService.deleteCommentsByRoomId(this.roomId).subscribe();
  }
}
