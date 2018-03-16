import { Component, OnInit } from '@angular/core';
import { ChoiceContent } from '../choice-content';
import { AnswerOption } from '../answer-option';

@Component({
  selector: 'app-participant-choice-content',
  templateUrl: './participant-choice-content.component.html',
  styleUrls: ['./participant-choice-content.component.scss']
})
export class ParticipantChoiceContentComponent implements OnInit {
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
    [2, 3, 4],
    true);

  constructor() {
  }

  ngOnInit() {
  }
}
