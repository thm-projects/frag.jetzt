import { Component, OnInit } from '@angular/core';
import { ContentChoice } from '../../../models/content-choice';
import { DisplayAnswer } from '../content-choice-creator/content-choice-creator.component';
import { AnswerOption } from '../../../models/answer-option';
import { NotificationService } from '../../../services/util/notification.service';

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

  displayedColumns = ['label'];

  displayAnswers: DisplayAnswer[] = [];
  newAnswerOptionPoints = '';

  constructor(private notificationService: NotificationService) {
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
  setCorrect(label: string) {
    if (label === 'yes') {
      this.content.correctOptionIndexes = [0];
    }
    if (label === 'no') {
      this.content.correctOptionIndexes = [1];
    }
    this.fillCorrectAnswers();
  }
  checkAllowedContent(): boolean {
    return (this.content.correctOptionIndexes.length === 1);
  }

  submitContent(): void {
    if (!this.checkAllowedContent()) {
      this.notificationService.show('Select 1 true answer.');
      return;
    }
    console.log('submit content');
  }
}
