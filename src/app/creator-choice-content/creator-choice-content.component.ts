import { Component, OnInit } from '@angular/core';
import { AnswerOption } from '../answer-option';

@Component({
  selector: 'app-creator-choice-content',
  templateUrl: './creator-choice-content.component.html',
  styleUrls: ['./creator-choice-content.component.scss']
})
export class CreatorChoiceContentComponent implements OnInit {
  subject: string;
  body: string;
  newLabel: string;
  newPoints: string;
  options = [
    new AnswerOption('A - Giraffe', '0'),
    new AnswerOption('B - Bär', '0'),
    new AnswerOption('C - bra', '10')
    ];

  constructor() { }

  ngOnInit() {
  }

  addAnswer() {
    this.options.push(new AnswerOption(this.newLabel, this.newPoints));
    this.newLabel = '';
    this.newPoints = '';
  }
}
