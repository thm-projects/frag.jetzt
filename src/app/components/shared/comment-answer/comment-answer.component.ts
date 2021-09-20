import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentService } from '../../../services/websockets/ws-comment.service';
import { CommentService } from '../../../services/http/comment.service';
import { Comment } from '../../../models/comment';
import { User } from '../../../models/user';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { NotificationService } from '../../../services/util/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { DeleteAnswerComponent } from '../../creator/_dialogs/delete-answer/delete-answer.component';
import { LanguagetoolService } from '../../../services/http/languagetool.service';
import { EventService } from '../../../services/util/event.service';
import { WriteCommentComponent } from '../write-comment/write-comment.component';
import { CorrectWrong } from '../../../models/correct-wrong.enum';
import { Message } from '@stomp/stompjs';

@Component({
  selector: 'app-comment-answer',
  templateUrl: './comment-answer.component.html',
  styleUrls: ['./comment-answer.component.scss']
})
export class CommentAnswerComponent implements OnInit, OnDestroy {

  @ViewChild(WriteCommentComponent) commentComponent: WriteCommentComponent;

  comment: Comment;
  answer: string;
  isLoading = true;
  user: User;
  isStudent = true;
  edit = false;
  private _commentSubscription;

  constructor(protected route: ActivatedRoute,
              private notificationService: NotificationService,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentService,
              protected commentService: CommentService,
              private authenticationService: AuthenticationService,
              public languagetoolService: LanguagetoolService,
              public dialog: MatDialog,
              public eventService: EventService) {
  }

  ngOnInit() {
    this.user = this.authenticationService.getUser();
    if (this.user.role !== UserRole.PARTICIPANT) {
      this.isStudent = false;
    }
    this.route.params.subscribe(params => {
      this.commentService.getComment(params['commentId']).subscribe(comment => {
        this.comment = comment;
        this.answer = this.comment.answer;
        this.edit = !this.answer;
        this.isLoading = false;
        this._commentSubscription = this.wsCommentService.getCommentStream(comment.roomId)
          .subscribe(msg => this.onMessageReceive(msg));
      });
    });
  }

  ngOnDestroy() {
    if (this._commentSubscription) {
      this._commentSubscription.unsubscribe();
    }
  }

  saveAnswer(): (string) => void {
    return (text: string) => {
      this.answer = text;
      this.edit = !this.answer;
      this.commentService.answer(this.comment, this.answer).subscribe();
      this.translateService.get('comment-page.comment-answered').subscribe(msg => {
        this.notificationService.show(msg);
      });
    };
  }

  openDeleteAnswerDialog(): () => void {
    return () => {
      const dialogRef = this.dialog.open(DeleteAnswerComponent, {
        width: '400px'
      });
      dialogRef.afterClosed()
        .subscribe(result => {
          if (result === 'delete') {
            this.deleteAnswer();
          }
        });
    };
  }

  deleteAnswer() {
    this.commentComponent.commentData.clear();
    this.answer = null;
    this.commentService.answer(this.comment, this.answer).subscribe();
    this.translateService.get('comment-page.answer-deleted').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  onEditClick() {
    this.edit = true;
    setTimeout(() => this.commentComponent.commentData.set(this.answer));
  }

  private onMessageReceive(msg: Message) {
    const message = JSON.parse(msg.body);
    const payload = message.payload;
    if (payload.id !== this.comment.id) {
      return;
    }
    if (message.type === 'CommentHighlighted') {
      this.comment.highlighted = payload.lights as boolean;
    } else if (message.type === 'CommentPatched') {
      for (const [key, value] of Object.entries(payload.changes)) {
        switch (key) {
          case 'read':
            this.comment.read = value as boolean;
            break;
          case 'correct':
            this.comment.correct = value as CorrectWrong;
            break;
          case 'favorite':
            this.comment.favorite = value as boolean;
            break;
          case 'bookmark':
            this.comment.bookmark = value as boolean;
            break;
          case 'score':
            this.comment.score = value as number;
            break;
          case 'upvotes':
            this.comment.upvotes = value as number;
            break;
          case 'downvotes':
            this.comment.downvotes = value as number;
            break;
          case 'keywordsFromSpacy':
            this.comment.keywordsFromSpacy = JSON.parse(value as string);
            break;
          case 'keywordsFromQuestioner':
            this.comment.keywordsFromQuestioner = JSON.parse(value as string);
            break;
          case 'ack':
            this.comment.ack = value as boolean;
            break;
          case 'tag':
            this.comment.tag = value as string;
            break;
          case 'answer':
            this.comment.answer = value as string;
            this.answer = this.comment.answer;
            this.edit = !this.answer;
            break;
        }
      }
    }
  }
}
