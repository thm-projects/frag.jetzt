import { Component, Inject, OnInit } from '@angular/core';
import { Comment } from '../../../../models/comment';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';
import { CommentListComponent } from '../../../shared/comment-list/comment-list.component';
import { EventService } from '../../../../services/util/event.service';

@Component({
  selector: 'app-comment-answer-form',
  templateUrl: './comment-answer-form.component.html',
  styleUrls: ['./comment-answer-form.component.scss']
})
export class CommentAnswerFormComponent implements OnInit {

  comment: Comment;

  bodyForm = new FormControl('', [Validators.required]);

  constructor(
              private notification: NotificationService,
              public dialogRef: MatDialogRef<CommentListComponent>,
              private translateService: TranslateService,
              public dialog: MatDialog,
              private translationService: TranslateService,
              public eventService: EventService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  checkInputData(body: string): boolean {
    body = body.trim();
    if (!body) {
      this.translationService.get('comment-page.error-comment').subscribe(message => {
        this.notification.show(message);
      });
      return false;
    }
    return true;
  }

  closeDialog(body: string) {
    if (this.checkInputData(body) === true) {
      this.dialogRef.close(body);
    }
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.onNoClick();
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildCreateCommentActionCallback(text: HTMLInputElement): () => void {
    return () => this.closeDialog(text.value);
  }
}
