import { Component, Inject, OnInit } from '@angular/core';
import { AnswerOption } from '../../../models/answer-option';
import { ContentChoice } from '../../../models/content-choice';
import { ContentService } from '../../../services/http/content.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { AnswerEditComponent } from '../../dialogs/answer-edit/answer-edit.component';
import { ContentType } from '../../../models/content-type.enum';
import { ContentListComponent } from '../content-list/content-list.component';
import { ContentDeleteComponent } from '../../dialogs/content-delete/content-delete.component';

export class DisplayAnswer {
  answerOption: AnswerOption;
  correct: boolean;

  constructor(answerOption: AnswerOption, correct: boolean) {
    this.answerOption = answerOption;
    this.correct = correct;
  }
}

@Component({
  selector: 'app-content-choice-creator',
  templateUrl: './content-choice-creator.component.html',
  styleUrls: ['./content-choice-creator.component.scss']
})
export class ContentChoiceCreatorComponent implements OnInit {
  singleChoice = true;
  content: ContentChoice = new ContentChoice(
    '0',
    '1',
    '',
    '',
    '',
    1,
    [],
    [],
    [],
    true,
    ContentType.CHOICE
  );

  displayedColumns = ['label', 'points', 'actions'];

  displayAnswers: DisplayAnswer[] = [];
  lastDeletedDisplayAnswer: DisplayAnswer;

  newAnswerOptionChecked = false;
  newAnswerOptionLabel = '';
  newAnswerOptionPoints = '';

  editDisplayAnswer: DisplayAnswer;
  originalDisplayAnswer: DisplayAnswer;

  editDialogMode = false;
  changesAllowed = false;

  roomId: string;
  roomShortId: string;

  constructor(private contentService: ContentService,
              private notificationService: NotificationService,
              private route: ActivatedRoute,
              public dialog: MatDialog,
              public dialogRef: MatDialogRef<ContentListComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.roomShortId = this.route.snapshot.paramMap.get('roomId');
    this.roomId = localStorage.getItem(`roomId`);
    this.fillCorrectAnswers();
  }

  fillCorrectAnswers() {
    this.displayAnswers = [];
    for (let i = 0; i < this.content.options.length; i++) {
      this.displayAnswers.push(new DisplayAnswer(this.content.options[i], this.content.correctOptionIndexes.includes(i)));
    }
  }

  findAnswerIndexByLabel(label: string): number {
    let index = -1;
    for (let i = 0; i < this.content.options.length; i++) {
      if (this.content.options[i].label.valueOf() === label.valueOf()) {
        index = i;
        break;
      }
    }
    return index;
  }

  addAnswer($event) {
    $event.preventDefault();
    if (this.newAnswerOptionLabel === '') {
      this.notificationService.show('No empty answers allowed.');
      this.newAnswerOptionChecked = false;
      this.newAnswerOptionLabel = '';
      this.newAnswerOptionPoints = '';
      return;
    }
    if (this.singleChoice && this.content.correctOptionIndexes.length > 0 && this.newAnswerOptionChecked) {
      this.notificationService.show('In single choice mode is only 1 true answer allowed.');
      this.newAnswerOptionChecked = false;
      this.newAnswerOptionLabel = '';
      this.newAnswerOptionPoints = '';
      return;
    }
    for (let i = 0; i < this.content.options.length; i++) {
      if (this.content.options[i].label.valueOf() === this.newAnswerOptionLabel.valueOf()) {
        this.notificationService.show('Same answer label is not allowed.');
        return;
      }
    }
    this.content.options.push(new AnswerOption(this.newAnswerOptionLabel, this.newAnswerOptionPoints));
    this.newAnswerOptionChecked = false;
    this.newAnswerOptionLabel = '';
    this.newAnswerOptionPoints = '';
    this.fillCorrectAnswers();
  }

  openAnswerModificationDialog($event, label: string, points: string, correct: boolean) {
    $event.preventDefault();
    const index = this.findAnswerIndexByLabel(label);
    this.editDisplayAnswer = new DisplayAnswer(new AnswerOption(label, points), correct);
    this.originalDisplayAnswer = new DisplayAnswer(new AnswerOption(label, points), correct);
    const dialogRef = this.dialog.open(AnswerEditComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.answer = this.editDisplayAnswer;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'edit') {
          this.saveChanges(index, this.editDisplayAnswer, true);
        }
      });
  }

  saveChanges(index: number, answer: DisplayAnswer, matDialogOutput: boolean) {
    this.content.options[index].label = answer.answerOption.label;
    this.content.options[index].points = answer.answerOption.points;
    const indexInCorrectOptionIndexes = this.content.correctOptionIndexes.indexOf(index);
    if (indexInCorrectOptionIndexes === -1 && answer.correct) {
      if (this.singleChoice) {
        this.content.correctOptionIndexes = [index];
        this.fillCorrectAnswers();
        return;
      }
      this.content.correctOptionIndexes.push(index);
    }
    if (indexInCorrectOptionIndexes !== -1 && !answer.correct) {
      this.content.correctOptionIndexes.splice(indexInCorrectOptionIndexes, 1);
    }
    this.fillCorrectAnswers();
    if (matDialogOutput) {
      this.notificationService.show('Update changes.');
    }
  }

  deleteAnswer($event, label: string) {
    $event.preventDefault();
    const index = this.findAnswerIndexByLabel(label);
    this.lastDeletedDisplayAnswer = new DisplayAnswer(this.content.options[index], false);
    this.content.options.splice(index, 1);
    for (let j = 0; j < this.content.correctOptionIndexes.length; j++) {
      if (this.content.correctOptionIndexes[j] === index) {
        this.lastDeletedDisplayAnswer.correct = true;
        this.content.correctOptionIndexes.splice(j, 1);
      }
      if (this.content.correctOptionIndexes[j] > index) { // [j] > i
        this.content.correctOptionIndexes[j] = this.content.correctOptionIndexes[j] - 1;
      }
    }
    this.fillCorrectAnswers();
    this.notificationService.show('Answer "' + this.lastDeletedDisplayAnswer.answerOption.label + '" successfully deleted.');
  }

  recoverDeletedAnswer($event) {
    $event.preventDefault();
    let msgAddon = 'Answer "' + this.lastDeletedDisplayAnswer.answerOption.label + '" successfully recovered.';
    if (this.lastDeletedDisplayAnswer === null) {
      this.notificationService.show('Nothing to recover.');
    }
    for (let i = 0; i < this.content.options.length; i++) {
      if (this.content.options[i].label.valueOf() === this.lastDeletedDisplayAnswer.answerOption.label.valueOf()) {
        this.notificationService.show('Same answer label is not allowed.');
        return;
      }
    }
    this.content.options.push(this.lastDeletedDisplayAnswer.answerOption);
    if (this.lastDeletedDisplayAnswer.correct) {
      if (this.singleChoice && this.content.correctOptionIndexes.length > 0) {
        msgAddon = 'In single mode is only 1 true answer allowed. Recovered item is set to false.';
      } else {
        this.content.correctOptionIndexes.push(this.content.options.length - 1);
      }
    }
    this.notificationService.show(msgAddon);
    this.lastDeletedDisplayAnswer = null;
    this.fillCorrectAnswers();
  }

  switchValue(label: string) {
    const index = this.findAnswerIndexByLabel(label);
    this.editDisplayAnswer = new DisplayAnswer(
      new AnswerOption(
        this.displayAnswers[index].answerOption.label,
        this.displayAnswers[index].answerOption.points),
      !this.displayAnswers[index].correct);
    this.saveChanges(index, this.editDisplayAnswer, false);
  }

  reset($event) {
    $event.preventDefault();
    this.content.subject = '';
    this.content.body = '';
    this.content.options = [];
    this.content.correctOptionIndexes = [];
    this.fillCorrectAnswers();
    this.notificationService.show('Reset all inputs to default.');
  }

  resetAfterSubmit() {
    this.content.subject = '';
    this.content.body = '';
    this.content.options = [];
    this.content.correctOptionIndexes = [];
    this.fillCorrectAnswers();
    this.notificationService.show('Content submitted. Ready for creation of new content.');
  }

  submitContent(subject: string, body: string) {
    if (this.content.body.valueOf() === '' || this.content.body.valueOf() === '') {
      this.notificationService.show('No empty fields allowed. Please check subject and body.');
      return;
    }
    if (this.content.options.length === 0) {
      this.notificationService.show('Choice content needs answers. Please add some answers.');
      return;
    }
    if (this.singleChoice && this.content.correctOptionIndexes.length !== 1) {
      this.notificationService.show('In single choice mode you have to select 1 true answer.');
      return;
    }
    if (!this.singleChoice && this.content.correctOptionIndexes.length < 1) {
      this.notificationService.show('In multiple choice mode you have to select at least 1 true answer.');
      return;
    }
    if (this.singleChoice) {
      this.content.multiple = false;
      this.content.format = ContentType.BINARY;
    } else {
      this.content.multiple = true;
      this.content.format = ContentType.CHOICE;
    }
    if (this.editDialogMode) {
      this.changesAllowed = true;
      return;
    }
    this.contentService.addContent(new ContentChoice(
      '',
      '',
      this.roomId,
      subject,
      body,
      1,
      [],
      this.content.options,
      this.content.correctOptionIndexes,
      this.content.multiple,
      ContentType.CHOICE
    )).subscribe();
    this.resetAfterSubmit();
  }

  editDialogClose($event, action: string) {
    $event.preventDefault();
    if (action.valueOf() === 'edit') {
      this.submitContent(this.content.subject, this.content.body);
    }
    if (action.valueOf() === 'abort') {
      this.dialogRef.close(action);
    }
    if (this.changesAllowed) {
      this.dialogRef.close(action);
    }
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
