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
    if (this.content.contentId === '0') {
      this.contentService.addContent(this.content).subscribe();
    } else {
      // ToDo: Implement function in service
      // this.contentService.updateContent(this.content).subscribe();
    }
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
}
