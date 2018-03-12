import { Component, OnInit } from '@angular/core';
import { ContentAnswerService } from '../content-answer.service';
import { AnswerText } from '../answer-text';

@Component({
  selector: 'app-content-answers-list',
  templateUrl: './content-answers-list.component.html',
  styleUrls: ['./content-answers-list.component.scss']
})
export class ContentAnswersListComponent implements OnInit {
  textAnswers: AnswerText[];

  constructor(private contentAnswerService: ContentAnswerService) { }

  ngOnInit() {
    this.getAnswerTexts();
  }

  getAnswerTexts(): void {
    this.contentAnswerService.getAnswerTexts().
      subscribe(textAnswers => {
        this.textAnswers = textAnswers;
      });
  }
}
