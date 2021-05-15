import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Comment } from '../../../../models/comment';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';
import { User } from '../../../../models/user';
import { CommentListComponent } from '../../comment-list/comment-list.component';
import { EventService } from '../../../../services/util/event.service';
import { SpacyDialogComponent } from '../spacy-dialog/spacy-dialog.component';

@Component({
  selector: 'app-submit-comment',
  templateUrl: './create-comment.component.html',
  styleUrls: ['./create-comment.component.scss']
})
export class CreateCommentComponent implements OnInit {

  comment: Comment;

  user: User;
  roomId: string;
  tags: string[];
  selectedTag: string;

  commentLangs = [
    { lang: 'de' },
    { lang: 'en' },
    { lang: 'fr' },
    {lang: 'auto'}
  ];
  selectedLang = 'auto';
  commentLang: string = this.selectedLang;

  bodyForm = new FormControl('', [Validators.required]);

  @ViewChild('commentBody', { static: true })commentBody: HTMLTextAreaElement;

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
    setTimeout(() => {
      document.getElementById('answer-input').focus();
    }, 0);
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
      const comment = new Comment();
      comment.roomId = localStorage.getItem(`roomId`);
      comment.body = body;
      comment.creatorId = this.user.id;
      comment.createdFromLecturer = this.user.role === 1;
      comment.tag = this.selectedTag;
      this.openSpacyDialog(comment, this.commentLang );
    }
  }

  openSpacyDialog(comment: Comment, commentLang: string): void {
    const dialogRef = this.dialog.open(SpacyDialogComponent, {
      data: {
        comment,
        commentLang
      }
    });

    dialogRef.afterClosed()
      .subscribe(result => {
        if (result) {
          this.dialogRef.close(result);
        }
      });

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
  buildCreateCommentActionCallback(text: HTMLInputElement|HTMLTextAreaElement): () => void {
    return () => this.closeDialog(text.value);
  }
}
