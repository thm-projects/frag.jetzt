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
              private route: ActivatedRoute) {}

  ngOnInit() {
    this.getAnswerTexts();
    this.route.params.subscribe(params => {
      this.contentDetailComponent.getContent(params['id']); // todo: filtered answers befüllen
    });
    for (let i = 0; i < this.textAnswers.length; i++) {
      console.log('kre');
      for (let j = 0; i < this.content.length; j++) {
        if (this.textAnswers[i].contentId === this.content[j].id) { this.filteredTextAnswers.push(this.textAnswers[i]); }
      }
    }
  }

  getAnswerTexts(): void {
    this.contentAnswerService.getAnswerTexts().subscribe(textAnswers => {
      this.textAnswers = textAnswers;
    });
  }
}
