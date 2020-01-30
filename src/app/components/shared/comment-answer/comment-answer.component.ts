import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';
import { WsCommentServiceService } from '../../../services/websockets/ws-comment-service.service';
import { CommentService } from '../../../services/http/comment.service';
import { Comment } from '../../../models/comment';
import { User } from '../../../models/user';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { NotificationService } from '../../../services/util/notification.service';

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

  constructor(protected route: ActivatedRoute,
              private notificationService: NotificationService,
              private translateService: TranslateService,
              protected langService: LanguageService,
              protected wsCommentService: WsCommentServiceService,
              protected commentService: CommentService,
              private authenticationService: AuthenticationService) { }

  ngOnInit() {
    this.user = this.authenticationService.getUser();
    if (this.user.role !== UserRole.PARTICIPANT) {
      this.isStudent = false;
    }
    this.route.params.subscribe(params => {
      this.commentService.getComment(params['commentId']).subscribe(comment => {
        this.comment = comment;
        this.answer = this.comment.answer;
        this.isLoading = false;
      });
    });
  }

  saveAnswer() {
    this.wsCommentService.answer(this.comment, this.answer);
    this.translateService.get('comment-list.comment-answered').subscribe(msg => {
      this.notificationService.show(msg);
    });
  }

}
