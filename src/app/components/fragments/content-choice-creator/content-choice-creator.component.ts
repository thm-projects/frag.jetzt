import { Component, OnInit } from '@angular/core';
import { AnswerOption } from '../../../models/answer-option';
import { ContentChoice } from '../../../models/content-choice';
import { ContentService } from '../../../services/http/content.service';
import { NotificationService } from '../../../services/util/notification.service';
import { MatDialog } from '@angular/material';
import { AnswerEditComponent } from '../../dialogs/answer-edit/answer-edit.component';

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
  singleChoice: boolean;
  multipleChoice: boolean;
  content: ContentChoice = new ContentChoice('0',
    '1',
    '',
    '',
    '',
    1,
    [],
    [],
    true);

  displayedColumns = ['label', 'points'];

  displayAnswers: DisplayAnswer[] = [];
  lastDeletedDisplayAnswer: DisplayAnswer;

  newAnswerOptionChecked = false;
  newAnswerOptionLabel = '';
  newAnswerOptionPoints = '';

  editDisplayAnswer: DisplayAnswer;
  originalDisplayAnswer: DisplayAnswer;

  constructor(private contentService: ContentService,
              private notificationService: NotificationService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.fillCorrectAnswers();
  }

  fillCorrectAnswers() {
    this.displayAnswers = [];
    for (let i = 0; i < this.content.options.length; i++) {
      this.displayAnswers.push(new DisplayAnswer(this.content.options[i], this.content.correctOptionIndexes.includes(i)));
    }
  }

  submitContent() {
    /*   if (this.content.contentId === '0') {
         this.contentService.addContent(this.content).subscribe();
       } else {
         // ToDo: Implement function in service
         // this.contentService.updateContent(this.content).subscribe();
       } */
    console.log('submit');
  }

  addAnswer() {
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
    this.content.options.push(new AnswerOption(this.newAnswerOptionLabel, this.newAnswerOptionPoints));
    if (this.newAnswerOptionChecked) {
      this.content.correctOptionIndexes.push(this.content.options.length - 1);
    }
    this.newAnswerOptionChecked = false;
    this.newAnswerOptionLabel = '';
    this.newAnswerOptionPoints = '';
    this.fillCorrectAnswers();
    this.submitContent();
  }

  openAnswerModificationDialog(label: string, points: string, correct: boolean) {
    this.editDisplayAnswer = new DisplayAnswer(new AnswerOption(label, points), correct);
    this.originalDisplayAnswer = new DisplayAnswer(new AnswerOption(label, points), correct);
    const dialogRef = this.dialog.open(AnswerEditComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.answer = this.editDisplayAnswer;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'edit') {
          this.editCheckChanges();
        }
      });
  }

  editCheckChanges() {
    for (let i = 0; i < this.content.options.length; i++) {
      if (this.content.options[i].label === this.originalDisplayAnswer.answerOption.label) {

        if (this.originalDisplayAnswer.answerOption.label !== this.editDisplayAnswer.answerOption.label) {
          this.content.options[i].label = this.editDisplayAnswer.answerOption.label;
        }
        if (this.originalDisplayAnswer.answerOption.points !== this.editDisplayAnswer.answerOption.points) {
          this.content.options[i].points = this.editDisplayAnswer.answerOption.points;
        }
        if (this.originalDisplayAnswer.correct !== this.editDisplayAnswer.correct) {
          if (!this.editDisplayAnswer.correct) {
            for (let j = 0; i < this.content.correctOptionIndexes.length; j++) {
              console.log(this.content.correctOptionIndexes);
              if (this.content.correctOptionIndexes[j] === i && !this.editDisplayAnswer.correct) {
                this.content.correctOptionIndexes.splice(j, 1);
                console.log(this.content.correctOptionIndexes);
              }
            }
          }
          if (this.editDisplayAnswer.correct) {
            this.content.correctOptionIndexes.push(i);
          }
        }
      }
    }
    this.fillCorrectAnswers();
  }

  deleteAnswer(label: string) {
    console.log('deleteAnswer: ' + label);
    console.log('Antwortmöglichkeiten vorher:');
    console.log(this.content.options);
    console.log('Richtige Antworten vorher:');
    console.log(this.content.correctOptionIndexes);
    for (let i = 0; i < this.content.options.length; i++) {
      if (this.content.options[i].label === label) {
        console.log('found label: ' + label);
        this.lastDeletedDisplayAnswer = new DisplayAnswer(this.content.options[i], false);
        this.content.options.splice(i, 1);
        for (let j = 0; j < this.content.correctOptionIndexes.length; j++) {
          if (this.content.correctOptionIndexes[j] === i) {
            this.lastDeletedDisplayAnswer.correct = true;
            this.content.correctOptionIndexes.splice(j, 1);
          }
          if (this.content.correctOptionIndexes[j] >= i) {
            this.content.correctOptionIndexes[j] = this.content.correctOptionIndexes[j] - 1;
          }
        }
      }
    }
    console.log('Antwortmöglichkeiten danach:');
    console.log(this.content.options);
    console.log('Richtige Antworten danach:');
    console.log(this.content.correctOptionIndexes);
    this.fillCorrectAnswers();
    console.log('Last removed item: ');
    console.log(this.lastDeletedDisplayAnswer);
    this.notificationService.show('Answer "' + this.lastDeletedDisplayAnswer.answerOption.label + '" successfully deleted.');
  }

  recoverDeletedAnswer() {
    if (this.lastDeletedDisplayAnswer === null) {
      this.notificationService.show('Nothing to recover');
    }
    this.content.options.push(this.lastDeletedDisplayAnswer.answerOption);
    if (this.lastDeletedDisplayAnswer.correct) {
      this.content.correctOptionIndexes.push(this.content.options.length - 1);
    }
    this.notificationService.show('Answer "' + this.lastDeletedDisplayAnswer.answerOption.label + '" successfully recovered.');
    this.lastDeletedDisplayAnswer = null;
    this.fillCorrectAnswers();
  }

  showRow(row: any) {
    console.log(row);
  }
}


// TODO: nicht 2x die gleiche Antwort
