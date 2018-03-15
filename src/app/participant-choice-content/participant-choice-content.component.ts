import { Component, OnInit } from '@angular/core';
import { ChoiceContent } from '../choice-content';
import { AnswerOption } from '../answer-option';

@Component({
  selector: 'app-participant-choice-content',
  templateUrl: './participant-choice-content.component.html',
  styleUrls: ['./participant-choice-content.component.scss']
})
export class ParticipantChoiceContentComponent implements OnInit {
  testAnswers = [
    new AnswerOption('A - Giraffe', '0'),
    new AnswerOption('B - Bär', '0'),
    new AnswerOption('C - bra', '10')
  ];
  testCorrectAnswers = [2];
  testChoiceContent = new ChoiceContent(
    '1', '1', '1', 'Tierkunde', 'Welches Tier ist schwarz mit weißen Streifen?', 1, this.testAnswers, this.testCorrectAnswers, false);
  constructor() { }

  ngOnInit() {
  }

}
