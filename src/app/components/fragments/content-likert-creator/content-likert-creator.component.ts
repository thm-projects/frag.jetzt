import { Component, OnInit } from '@angular/core';
import { DisplayAnswer } from '../content-choice-creator/content-choice-creator.component';
import { ContentChoice } from '../../../models/content-choice';
import { AnswerOption } from '../../../models/answer-option';

@Component({
  selector: 'app-content-likert-creator',
  templateUrl: './content-likert-creator.component.html',
  styleUrls: ['./content-likert-creator.component.scss']
})
export class ContentLikertCreatorComponent implements OnInit {
  likertScale = [
    'Strongly agree',
    'Agree',
    'Neither agree nor disagree',
    'Disagree',
    'Strongly disagree'
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

  displayedColumns = ['label'];

  displayAnswers: DisplayAnswer[] = [];
  newAnswerOptionPoints = '';

  constructor() {
  }

  fillCorrectAnswers() {
    this.displayAnswers = [];
    for (let i = 0; i < this.content.options.length; i++) {
      this.content.correctOptionIndexes.push(i);
      this.displayAnswers.push(new DisplayAnswer(this.content.options[i], this.content.correctOptionIndexes.includes(i)));
    }
  }

  ngOnInit() {
    for (let i = 0; i < this.likertScale.length; i++) {
      this.content.options.push(new AnswerOption(this.likertScale[i], this.newAnswerOptionPoints));
    }
    this.fillCorrectAnswers();
  }

  submitContent(): void {
    console.log('submitContent');
  }
}
