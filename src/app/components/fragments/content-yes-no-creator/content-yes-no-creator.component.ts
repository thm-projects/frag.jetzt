import { Component, OnInit } from '@angular/core';
import { ContentChoice } from '../../../models/content-choice';
import { DisplayAnswer } from '../content-choice-creator/content-choice-creator.component';
import { AnswerOption } from '../../../models/answer-option';

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
    false);

  displayedColumns = ['label', 'points'];

  displayAnswers: DisplayAnswer[] = [];
  newAnswerOptionPoints = '';

  constructor() {
  }

  ngOnInit() {
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

  submitContent(): void {
    console.log('submit content');
  }
}
