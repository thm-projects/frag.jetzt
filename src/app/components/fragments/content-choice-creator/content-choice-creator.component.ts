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

  displayedColumns = ['label', 'points', 'actions'];

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
    if (this.content.options.length === 0) {
      this.notificationService.show('Choice content needs answers. Please add some answers.');
      return;
    }
    if (this.singleChoice && this.content.correctOptionIndexes.length !== 1) {
      this.notificationService.show('In single choice mode you have to select 1 true answer.');
      return;
    }
    if (this.singleChoice) {
      this.content.multiple = false;
    }
    if (this.multipleChoice) {
      this.content.multiple = true;
    }
    this.notificationService.show('Content submitted.');
    /*   if (this.content.contentId === '0') {
         this.contentService.addContent(this.content).subscribe();
       } else {
         // ToDo: Implement function in service
         // this.contentService.updateContent(this.content).subscribe();
       } */
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
    for (let i = 0; i < this.content.options.length; i++) {
      if (this.content.options[i].label.valueOf() === this.newAnswerOptionLabel.valueOf()) {
        this.notificationService.show('Same answer label is not allowed.');
        return;
      }
    }
    this.content.options.push(new AnswerOption(this.newAnswerOptionLabel, this.newAnswerOptionPoints));
    if (this.newAnswerOptionChecked) {
      this.content.correctOptionIndexes.push(this.content.options.length - 1);
    }
    this.newAnswerOptionChecked = false;
    this.newAnswerOptionLabel = '';
    this.newAnswerOptionPoints = '';
    this.fillCorrectAnswers();
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
        if (this.originalDisplayAnswer.answerOption.label.valueOf() !== this.editDisplayAnswer.answerOption.label.valueOf()) {
          this.content.options[i].label = this.editDisplayAnswer.answerOption.label;
        }
        if (this.originalDisplayAnswer.answerOption.points.valueOf() !== this.editDisplayAnswer.answerOption.points.valueOf()) {
          this.content.options[i].points = this.editDisplayAnswer.answerOption.points;
        }
        if (this.originalDisplayAnswer.correct !== this.editDisplayAnswer.correct) {
          if (!this.editDisplayAnswer.correct) {
            for (let j = 0; i < this.content.correctOptionIndexes.length; j++) {
              if (this.content.correctOptionIndexes[j] === i && !this.editDisplayAnswer.correct) {
                this.content.correctOptionIndexes.splice(j, 1);
              }
            }
          }
          if (this.editDisplayAnswer.correct) {
            if (this.singleChoice && this.content.correctOptionIndexes.length > 0) {
              this.notificationService.show('In single mode is only 1 selected answer allowed.');
              this.editDisplayAnswer.correct = false;
            } else {
              this.content.correctOptionIndexes.push(i);
            }
          }
        }
      }
    }
    this.fillCorrectAnswers();
  }

  deleteAnswer(label: string) {
    for (let i = 0; i < this.content.options.length; i++) {
      if (this.content.options[i].label.valueOf() === label.valueOf()) {
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
    this.fillCorrectAnswers();
    this.notificationService.show('Answer "' + this.lastDeletedDisplayAnswer.answerOption.label + '" successfully deleted.');
  }

  recoverDeletedAnswer() {
    let msgAddon = 'Answer "' + this.lastDeletedDisplayAnswer.answerOption.label + '" successfully recovered.';
    if (this.lastDeletedDisplayAnswer === null) {
      this.notificationService.show('Nothing to recover');
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
    for (let i = 0; i < this.content.options.length; i++) {
      if (this.content.options[i].label.valueOf() === label.valueOf()) {
        if (this.content.correctOptionIndexes.length === 0) {
          this.content.correctOptionIndexes.push(i);
          this.fillCorrectAnswers();
          console.log(this.content.correctOptionIndexes);
          return;
        }
        const index = this.content.correctOptionIndexes.indexOf(i);
        if (index === -1) {
          this.content.correctOptionIndexes.push(i);
        } else {
          this.content.correctOptionIndexes.splice(index, 1);
        }
      }
    }
    this.fillCorrectAnswers();
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
}
