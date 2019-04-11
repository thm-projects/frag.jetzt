import { Component, Input, OnInit } from '@angular/core';
import { Comment } from '../../../models/comment';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { PresentCommentComponent } from '../_dialogs/present-comment/present-comment.component';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {
  @Input() comment: Comment;
  isStudent = false;
  isLoading = true;
  hasVoted = 0;
  lang: string;

  constructor(protected authenticationService: AuthenticationService,
              private route: ActivatedRoute,
              private location: Location,
              private commentService: CommentService,
              private notification: NotificationService,
              private translateService: TranslateService,
              public dialog: MatDialog,
              protected langService: LanguageService,
              private wsCommentService: WsCommentServiceService) {
    langService.langEmitter.subscribe(lang => {
      translateService.use(lang);
      this.lang = lang;
      } );
  }

  ngOnInit() {
    if (this.authenticationService.getRole() === 0) {
      this.isStudent = true;
    }
    this.lang = localStorage.getItem('currentLang');
    this.translateService.use(this.lang);
  }

  setRead(comment: Comment): void {
    this.comment = this.wsCommentService.toggleRead(comment);
  }

  setCorrect(comment: Comment): void {
    this.comment = this.wsCommentService.toggleCorrect(comment);
  }

  setFavorite(comment: Comment): void {
    this.comment = this.wsCommentService.toggleFavorite(comment);
  }

  voteUp(comment: Comment): void {
    if (this.hasVoted !== 1) {
      this.wsCommentService.voteUp(comment);
      this.hasVoted = 1;
    }
  }

  voteDown(comment: Comment): void {
    if (this.hasVoted !== -1) {
      this.wsCommentService.voteDown(comment);
      this.hasVoted = -1;
    }
  }

  delete(comment: Comment): void {
    this.commentService.deleteComment(comment.id).subscribe(room => {
      this.notification.show(`Comment '${comment.body}' successfully deleted.`);
    });
  }

  openPresentDialog(body: string): void {
    const dialogRef = this.dialog.open(PresentCommentComponent, {
      position: {
        left: '10px',
        right: '10px'
      },
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%'
    });
    dialogRef.componentInstance.body = body;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'close') {
          return;
        }
      });
  }
}
