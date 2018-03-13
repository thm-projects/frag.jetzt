import { Component, OnInit } from '@angular/core';
import { ContentAnswerService } from '../content-answer.service';
import { AnswerText } from '../answer-text';
import { ContentDetailComponent } from '../content-detail/content-detail.component';
import { Content } from '../content';
import { ActivatedRoute } from '@angular/router';
import { forEach } from '@angular/router/src/utils/collection';

@Component({
  selector: 'app-content-answers-list',
  templateUrl: './content-answers-list.component.html',
  styleUrls: ['./content-answers-list.component.scss']
})
export class ContentAnswersListComponent implements OnInit {
  textAnswers: AnswerText[];
  content: Content[];
  filteredTextAnswers: AnswerText[];

  constructor(private contentAnswerService: ContentAnswerService,
              private contentDetailComponent: ContentDetailComponent,
              private route: ActivatedRoute) { }

  ngOnInit() {
    this.getAnswerTexts();
    this.route.params.subscribe(params => {
      this.contentDetailComponent.getContent(params['id']); // todo: filtered answers befüllen
    });
    for (const textAnswer of this.textAnswers) {
      console.log('kre');
      if (textAnswer.contentId === this.content.id) { this.filteredTextAnswers.push(textAnswer); }
    }
  }
  getAnswerTexts(): void {
    this.contentAnswerService.getAnswerTexts().
      subscribe(textAnswers => {
        this.textAnswers = textAnswers;
      });
  }
}
