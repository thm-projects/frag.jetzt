import { Component, Input, OnInit } from '@angular/core';
import { ContentChoice } from '../../../models/content-choice';
import { AnswerOption } from '../../../models/answer-option';
import { ContentAnswerService } from '../../../services/http/content-answer.service';
import { NotificationService } from '../../../services/util/notification.service';

class CheckedAnswer {
  answerOption: AnswerOption;
  checked: boolean;

  constructor(answerOption: AnswerOption, checked: boolean) {
    this.answerOption = answerOption;
    this.checked = checked;
  }
}

@Component({
  selector: 'app-content-choice-participant',
  templateUrl: './content-choice-participant.component.html',
  styleUrls: ['./content-choice-participant.component.scss']
})
export class ContentChoiceParticipantComponent implements OnInit {
  @Input() content: ContentChoice;

  dummyContent: ContentChoice = new ContentChoice('2',
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
    false);
  checkedAnswers: CheckedAnswer[] = [];
  isAnswerSent = false;

  constructor(private answerService: ContentAnswerService,
              private notificationService: NotificationService) {
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
    if (!this.content.multiple && selectedAnswers.length !== 1) {
      this.notificationService.show('In single choice mode is only 1 selection allowed');
      this.isAnswerSent = false;
      return;
    }
    this.isAnswerSent = true;
    this.notificationService.show('Answer successfully sent.');
    // ToDo: Implement function in service
    // this.answerService.addChoiceAnswer(selectedAnswers);
  }

  abstain($event) {
    $event.preventDefault();
    console.log('abstain');
  }
}
