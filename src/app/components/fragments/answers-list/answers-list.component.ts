import { Component, OnInit } from '@angular/core';
import { ContentAnswerService } from '../../../services/http/content-answer.service';
import { AnswerText } from '../../../models/answer-text';
import { ActivatedRoute } from '@angular/router';
import { ContentService } from '../../../services/http/content.service';

@Component({
  selector: 'app-answers-list',
  templateUrl: './answers-list.component.html',
  styleUrls: ['./answers-list.component.scss']
})
export class AnswersListComponent implements OnInit {
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
    this.contentAnswerService.getAnswers(contentId)
      .subscribe(textAnswers => {
        this.textAnswers = textAnswers;
      });
  }
}
