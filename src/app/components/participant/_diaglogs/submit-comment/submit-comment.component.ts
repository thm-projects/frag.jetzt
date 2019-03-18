import { Component, Inject, OnInit } from '@angular/core';
import { Comment } from '../../../../models/comment';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { CommentCreatePageComponent } from '../../comment-create-page/comment-create-page.component';
import { AuthenticationService } from '../../../../services/http/authentication.service';


@Component({
  selector: 'app-submit-comment',
  templateUrl: './submit-comment.component.html',
  styleUrls: ['./submit-comment.component.scss']
})
export class SubmitCommentComponent implements OnInit {

  comment: Comment;

  constructor(private router: Router,
              private notification: NotificationService,
              public dialogRef: MatDialogRef<CommentCreatePageComponent>,
              private translateService: TranslateService,
              protected authenticationService: AuthenticationService,
              public dialog: MatDialog,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  onNoClick(): void {
    this.dialogRef.close('abort');
  }

  closeDialog(action: string) {
    this.dialogRef.close(action);
  }
}
