import { Component, Input, OnInit } from '@angular/core';
import { Comment } from '../../../models/comment';
import { UserRole } from '../../../models/user-roles.enum';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommentService } from '../../../services/http/comment.service';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {
  @Input() comment: Comment;
  userRole: UserRole;
  isLoading = true;

  constructor(protected authenticationService: AuthenticationService,
              private route: ActivatedRoute,
              private location: Location,
              private commentService: CommentService,
              private notification: NotificationService,
              private translateService: TranslateService,
              protected langService: LanguageService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang)); }

  ngOnInit() {
    this.userRole = this.authenticationService.getRole();
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  setRead(comment: Comment): void {
    comment.read = !comment.read;
    this.commentService.updateComment(comment).subscribe();
  }

  setCorrect(comment: Comment): void {
    comment.correct = !comment.correct;
    this.commentService.updateComment(comment).subscribe();
  }

  setFavorite(comment: Comment): void {
    comment.favorite = !comment.favorite;
    this.commentService.updateComment(comment).subscribe();
  }

  delete(comment: Comment): void {
    this.commentService.deleteComment(comment.id).subscribe(room => {
      this.notification.show(`Comment '${comment.subject}' successfully deleted.`);
    });
  }
}
