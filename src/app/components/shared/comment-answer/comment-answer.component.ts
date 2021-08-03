import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
import { GrammarChecker } from '../../../utils/grammar-checker';
import { EventService } from '../../../services/util/event.service';

@Component({
  selector: 'app-comment-answer',
  templateUrl: './comment-answer.component.html',
  styleUrls: ['./comment-answer.component.scss']
})
export class CommentAnswerComponent implements OnInit {

  comment: Comment;
  answer: string;
  isLoading = true;
  user: User;
  isStudent = true;
  edit = false;

  grammarChecker: GrammarChecker;

  @ViewChild('commentBody') commentBody: ElementRef<HTMLDivElement>;

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
    this.grammarChecker = new GrammarChecker(languagetoolService);
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
      });
    });
  }

  saveAnswer() {
    this.edit = !this.answer;
    this.commentService.answer(this.comment, this.answer).subscribe();
    this.translateService.get('comment-page.comment-answered').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  openDeleteAnswerDialog(): void {
    const dialogRef = this.dialog.open(DeleteAnswerComponent, {
      width: '400px'
    });
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteAnswer();
        }
      });
  }

  deleteAnswer() {
    if (this.commentBody) {
      this.commentBody.nativeElement.innerText = '';
    }
    this.answer = null;
    this.commentService.answer(this.comment, this.answer).subscribe();
    this.translateService.get('comment-page.answer-deleted').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

  onEditClick() {
    this.edit = true;
    setTimeout(() => {
      this.commentBody.nativeElement.innerText = this.answer;
    });
  }
}
