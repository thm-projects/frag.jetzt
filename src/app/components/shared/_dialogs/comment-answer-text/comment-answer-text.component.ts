import { Component, Inject, OnInit } from '@angular/core';
import { Comment } from '../../../../models/comment';
import { NotificationService } from '../../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';
import { User } from '../../../../models/user';
import { CommentListComponent } from '../../comment-list/comment-list.component';
import { EventService } from '../../../../services/util/event.service';

@Component({
  selector: 'app-comment-answer-text',
  templateUrl: './comment-answer-text.component.html',
  styleUrls: ['./comment-answer-text.component.scss']
})
export class CommentAnswerTextComponent implements OnInit {

  answer: string;

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
}
