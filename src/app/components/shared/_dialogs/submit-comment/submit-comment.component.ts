import { Component, Inject, OnInit } from '@angular/core';
import { Comment } from '../../../../models/comment';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { CommentPageComponent } from '../../comment-page/comment-page.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { FormControl, Validators } from '@angular/forms';
import { User } from '../../../../models/user';


@Component({
  selector: 'app-submit-comment',
  templateUrl: './submit-comment.component.html',
  styleUrls: ['./submit-comment.component.scss']
})
export class SubmitCommentComponent implements OnInit {

  comment: Comment;

  user: User;

  subjectForm = new FormControl('', [Validators.required]);
  bodyForm = new FormControl('', [Validators.required]);
  private date = new Date(Date.now());

  constructor(private route: ActivatedRoute,
              private notification: NotificationService,
              public dialogRef: MatDialogRef<CommentPageComponent>,
              private translateService: TranslateService,
              protected authenticationService: AuthenticationService,
              public dialog: MatDialog,
              private translationService: TranslateService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.user = this.authenticationService.getUser();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  checkInputData(subject: string, body: string): boolean {
    subject = subject.trim();
    body = body.trim();
    if (!subject && !body) {
      this.translationService.get('comment-page.error-both-fields').subscribe(message => {
        this.notification.show(message);
      });
      return false;
    }
    if (!subject) {
      this.translationService.get('comment-page.error-title').subscribe(message => {
        this.notification.show(message);
      });
      return false;
    }
    if (!body) {
      this.translationService.get('comment-page.error-comment').subscribe(message => {
        this.notification.show(message);
      });
      return false;
    }
    return true;
  }

  closeDialog(subject: string, body: string) {
    if (this.checkInputData(subject, body) === true) {
      const comment = new Comment();
      comment.roomId = localStorage.getItem(`roomId`);
      comment.subject = subject;
      comment.body = body;
      comment.userId = this.user.id;
      this.dialogRef.close(comment);
    }
  }
}
