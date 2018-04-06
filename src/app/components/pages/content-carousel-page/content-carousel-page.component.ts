import { Component, OnInit } from '@angular/core';
import { Content } from '../../../models/content';
import { ContentType } from '../../../models/content-type.enum';
import { AnswerOption } from '../../../models/answer-option';
import { ContentChoice } from '../../../models/content-choice';
import { ContentText } from '../../../models/content-text';
import { ContentService } from '../../../services/http/content.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-content-carousel-page',
  templateUrl: './content-carousel-page.component.html',
  styleUrls: ['./content-carousel-page.component.scss']
})
export class ContentCarouselPageComponent implements OnInit {
  ContentType: typeof ContentType = ContentType;

  test = [1, 2];
//  contents: Content[];
  contents = [
    new ContentChoice('0',
      '1',
      'roomId1',
      'MultipleChoice Subject',
      'MultipleChoice Body',
      1,
      [new AnswerOption('yes', ''), new AnswerOption('no', '')],
      [],
      true),
    new ContentChoice('0',
      '1',
      'roomId2',
      'SingleChoice Subject',
      'SingleChoide Body',
      1,
      [new AnswerOption('may', ''), new AnswerOption('not', '')],
      [],
      false),
    new ContentText('1',
      '1',
      '0',
      'TextContent Subject',
      'TextContent Body',
      1)
  ];

  constructor(private contentService: ContentService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      // ToDo: Check api call
/*      this.contentService.getContents(params['roomId']).subscribe(result => {
        this.contents = result;
      }); */
    });
  }
}
