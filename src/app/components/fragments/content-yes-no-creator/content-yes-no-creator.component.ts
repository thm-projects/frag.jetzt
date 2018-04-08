import { Component, Inject, OnInit } from '@angular/core';
import { ContentChoice } from '../../../models/content-choice';
import { DisplayAnswer } from '../content-choice-creator/content-choice-creator.component';
import { AnswerOption } from '../../../models/answer-option';
import { NotificationService } from '../../../services/util/notification.service';
import { ContentType } from '../../../models/content-type.enum';
import { ContentService } from '../../../services/http/content.service';
import { ActivatedRoute } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { ContentListComponent } from '../content-list/content-list.component';
import { ContentDeleteComponent } from '../../dialogs/content-delete/content-delete.component';

@Component({
  selector: 'app-content-yes-no-creator',
  templateUrl: './content-yes-no-creator.component.html',
  styleUrls: ['./content-yes-no-creator.component.scss']
})
export class ContentYesNoCreatorComponent implements OnInit {
  answerLabels = [
    'yes',
    'no'
  ];
  content: ContentChoice = new ContentChoice('0',
    '1',
    '',
    '',
    '',
    1,
    [],
    [],
    false,
    ContentType.BINARY
  );

  displayedColumns = ['label'];

  displayAnswers: DisplayAnswer[] = [];
  newAnswerOptionPoints = '';

  editDialogMode = false;

  constructor(private contentService: ContentService,
              private route: ActivatedRoute,
              private notificationService: NotificationService,
              public dialog: MatDialog,
              public dialogRef: MatDialogRef<ContentListComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.content.roomId = params['roomId'];
    });
    for (let i = 0; i < this.answerLabels.length; i++) {
      this.content.options.push(new AnswerOption(this.answerLabels[i], this.newAnswerOptionPoints));
    }
    this.fillCorrectAnswers();
  }

  fillCorrectAnswers() {
    this.displayAnswers = [];
    for (let i = 0; i < this.content.options.length; i++) {
      this.displayAnswers.push(new DisplayAnswer(this.content.options[i], this.content.correctOptionIndexes.includes(i)));
    }
  }

  setCorrect($event, label: string) {
    $event.preventDefault();
    if (label === 'yes') {
      this.content.correctOptionIndexes = [0];
    }
    if (label === 'no') {
      this.content.correctOptionIndexes = [1];
    }
    this.fillCorrectAnswers();
  }

  checkAllowedContent(): boolean {
    return (this.content.correctOptionIndexes.length === 1);
  }

  resetAfterSubmit() {
    this.content.subject = '';
    this.content.body = '';
    this.content.correctOptionIndexes = [];
    this.fillCorrectAnswers();
    this.notificationService.show('Content submitted. Ready for creation of new content.');
  }

  submitContent(): void {
    if (this.content.body.valueOf() === '' || this.content.body.valueOf() === '') {
      this.notificationService.show('No empty fields allowed. Please check subject and body.');
      return;
    }
    if (!this.checkAllowedContent()) {
      this.notificationService.show('Select 1 true answer.');
      return;
    }
    this.notificationService.show('Content sumbitted.');
    // ToDo: Check api call
    // this.contentService.addContent(this.content);
    // For Testing:
    // console.log(this.content);
    this.resetAfterSubmit();
  }

  editDialogClose($event, action: string) {
    $event.preventDefault();
    this.dialogRef.close(action);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openDeletionContentDialog($event): void {
    $event.preventDefault();
    const dialogRef = this.dialog.open(ContentDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.content = this.content;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.dialogRef.close(result);
        }
      });
  }
}
