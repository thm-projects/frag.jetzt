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
    [0, 1, 3],
    true);

  displayedColumns = ['label', 'points'];

  correctAnswers: CorrectAnswer[] = [];

  constructor(private contentService: ContentService) {
  }

  ngOnInit() {
    for (let i = 0; i < this.content.options.length; i++) {
      this.correctAnswers.push(new CorrectAnswer(this.content.options[i], this.content.correctOptionIndexes.includes(i)));
    }
    console.log(this.correctAnswers);
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
    this.submitContent();
  }
}
