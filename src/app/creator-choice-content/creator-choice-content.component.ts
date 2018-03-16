import { Component, OnInit } from '@angular/core';
import { AnswerOption } from '../answer-option';
import { ChoiceContent } from '../choice-content';
import { ContentService } from '../content.service';

export class CorrectAnswer {
  answerOption: AnswerOption;
  correct: boolean;

  constructor(answerOption: AnswerOption, correct: boolean) {
    this.answerOption = answerOption;
    this.correct = correct;
  }
}

@Component({
  selector: 'app-creator-choice-content',
  templateUrl: './creator-choice-content.component.html',
  styleUrls: ['./creator-choice-content.component.scss']
})
export class CreatorChoiceContentComponent implements OnInit {

  content: ChoiceContent = new ChoiceContent('0',
    '1',
    '',
    '',
    '',
    1,
    [],
    [],
    true);

  displayedColumns = ['label', 'points'];

  correctAnswers: CorrectAnswer[] = [];

  constructor(private contentService: ContentService) {
  }

  ngOnInit() {
    this.fillCorrectAnswers();
  }

  fillCorrectAnswers() {
    this.correctAnswers = [];
    for (let i = 0; i < this.content.options.length; i++) {
      this.correctAnswers.push(new CorrectAnswer(this.content.options[i], this.content.correctOptionIndexes.includes(i)));
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

  addAnswer(isCorrect: boolean, label: string, points: string) {
    this.content.options.push(new AnswerOption(label, points));
    if (isCorrect) {
      this.content.correctOptionIndexes.push(this.content.options.length);
    }
    this.fillCorrectAnswers();
    this.submitContent();
  }
}
