import { Component, OnInit } from '@angular/core';
import { AnswerOption } from '../../../models/answer-option';
import { ContentChoice } from '../../../models/content-choice';
import { ContentService } from '../../../services/http/content.service';
import { NotificationService } from '../../../services/util/notification.service';

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

  constructor(private contentService: ContentService,
              private notificationService: NotificationService) {
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
    this.notificationService.show('Answer "' + this.lastDeletedDisplayAnswer.answerOption.label + '" successfully recovered.')
    this.lastDeletedDisplayAnswer = null;
    this.fillCorrectAnswers();
  }

  showRow(row: any) {
    console.log(row);
  }
}


//TODO: nicht 2x die gleiche Antwort
