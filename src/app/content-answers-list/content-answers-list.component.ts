import { Component, OnInit } from '@angular/core';
import { ContentAnswerService } from '../content-answer.service';
import { AnswerText } from '../answer-text';
import { ContentDetailComponent } from '../content-detail/content-detail.component';
import { Content } from '../content';

@Component({
  selector: 'app-content-answers-list',
  templateUrl: './content-answers-list.component.html',
  styleUrls: ['./content-answers-list.component.scss']
})
export class ContentAnswersListComponent implements OnInit {
  textAnswers: AnswerText[];
  content: Content[];

  constructor(private contentAnswerService: ContentAnswerService,
              private contentDetailComponent: ContentDetailComponent) { }

  ngOnInit() {
    this.getAnswerTexts();
    // this.contentDetailComponent.getContent(???);
  }

  getAnswerTexts(): void {
    this.contentAnswerService.getAnswerTexts().
      subscribe(textAnswers => {
        this.textAnswers = textAnswers;
      });
  }
}
