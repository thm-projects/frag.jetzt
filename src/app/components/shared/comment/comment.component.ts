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

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {
  @Input() comment: Comment;
  isCreator = false;
  isLoading = true;

  constructor(protected authenticationService: AuthenticationService,
              private route: ActivatedRoute,
              private location: Location,
              private commentService: CommentService,
              private notification: NotificationService,
              private translateService: TranslateService,
              protected langService: LanguageService,
              private wsCommentService: WsCommentServiceService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang)); }

  ngOnInit() {
    if (this.authenticationService.getRole() === 0) {
      this.isCreator = true;
    }
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  setRead(comment: Comment): void {
    this.comment = this.wsCommentService.toggleRead(comment);
    // this.commentService.updateComment(comment).subscribe();
  }

  setCorrect(comment: Comment): void {
    this.comment = this.wsCommentService.toggleCorrect(comment);
    // this.commentService.updateComment(comment).subscribe();
  }

  setFavorite(comment: Comment): void {
    this.comment = this.wsCommentService.toggleFavorite(comment);
    // this.commentService.updateComment(comment).subscribe();
  }

  delete(comment: Comment): void {
    this.commentService.deleteComment(comment.id).subscribe(room => {
      this.notification.show(`Comment '${comment.body}' successfully deleted.`);
    });
  }
  /*
  parseIncomingMessage(message: Message) {
    const msg = JSON.parse(message.body);
    const payload = msg.payload;
    if (payload.id === this.comment.id) {
      for (const [key, value] of Object.entries(payload.changes)) {
        console.log(value);
        switch (key) {
          case 'read':     this.comment.read = value;
                           break;
          case 'correct' : this.comment.correct = value;
                           break;
          case 'favorite' : this.comment.favorite = value;
        }
      }
    }
  } */
}
