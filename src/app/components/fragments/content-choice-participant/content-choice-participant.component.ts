import { Component, OnInit } from '@angular/core';
import { ContentChoice } from '../../../models/content-choice';
import { AnswerOption } from '../../../models/answer-option';
import { ContentAnswerService } from '../../../services/http/content-answer.service';

class CheckedAnswer {
  answerOption: AnswerOption;
  checked: boolean;

  constructor(answerOption: AnswerOption, checked: boolean) {
    this.answerOption = answerOption;
    this.checked = checked;
  }
}

@Component({
  selector: 'app-participant-choice-content',
  templateUrl: './content-choice-participant.component.html',
  styleUrls: ['./content-choice-participant.component.scss']
})
export class ContentChoiceParticipantComponent implements OnInit {
  content: ContentChoice = new ContentChoice('2',
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
  checkedAnswers: CheckedAnswer[] = [];

  constructor(private answerService: ContentAnswerService) {
  }

  ngOnInit() {
    this.initAnswers();
  }

  initAnswers(): void {
    for (const answerOption of this.content.options) {
      this.checkedAnswers.push(new CheckedAnswer(answerOption, false));
    }
  }

  submitAnswer(): void {
    const selectedAnswers: number[] = [];
    for (let i = 0; i < this.checkedAnswers.length; i++) {
      if (this.checkedAnswers[i].checked) {
        selectedAnswers.push(i);
      }
    }
    // ToDo: Implement function in service
    // this.answerService.addChoiceAnswer(selectedAnswers);
  }
}
