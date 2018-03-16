import { Component, OnInit } from '@angular/core';
import { AnswerOption } from '../answer-option';
import { ChoiceContent } from '../choice-content';

@Component({
  selector: 'app-creator-choice-content',
  templateUrl: './creator-choice-content.component.html',
  styleUrls: ['./creator-choice-content.component.scss']
})
export class CreatorChoiceContentComponent implements OnInit {

  content: ChoiceContent = new ChoiceContent('2',
    '1',
    '1',
    'Choice Content 1',
    'This is the body of Choice Content 1',
    1,
    [
      new AnswerOption('Option 1', '0'),
      new AnswerOption('Option 2', '10'),
      new AnswerOption('Option 3', '20'),
      new AnswerOption('Option 4', '30')
    ],
    [1, 2, 3],
    true);

  displayedColumns = ['label', 'points'];

  constructor() {
  }

  ngOnInit() {
  }

  submitContent() {
  }

  addAnswer(isCorrect: boolean, label: string, points: number) {
  }
}
