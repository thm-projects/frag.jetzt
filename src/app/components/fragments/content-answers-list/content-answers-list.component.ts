import { Component, OnInit } from '@angular/core';
import { ContentAnswerService } from '../../../content-answer.service';
import { AnswerText } from '../../../models/answer-text';
import { ActivatedRoute } from '@angular/router';
import { ContentService } from '../../../content.service';

@Component({
  selector: 'app-content-answers-list',
  templateUrl: './content-answers-list.component.html',
  styleUrls: ['./content-answers-list.component.scss']
})
export class ContentAnswersListComponent implements OnInit {
  textAnswers: AnswerText[];

  constructor(
    private contentService: ContentService,
    private contentAnswerService: ContentAnswerService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getAnswerTexts(params['contentId']);
    });
  }

  getAnswerTexts(contentId: string): void {
    this.contentAnswerService.getTextAnswers(contentId)
      .subscribe(textAnswers => {
        this.textAnswers = textAnswers;
      });
  }
}
