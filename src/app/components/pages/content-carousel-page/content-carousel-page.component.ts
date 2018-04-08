import { Component, OnInit } from '@angular/core';
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
      true,
      ContentType.CHOICE),
    new ContentChoice('0',
      '1',
      'roomId2',
      'SingleChoice Subject',
      'SingleChoice Body',
      1,
      [new AnswerOption('may', ''), new AnswerOption('not', '')],
      [],
      false,
      ContentType.BINARY),
    new ContentText('1',
      '1',
      'roomId3',
      'TextContent Subject',
      'TextContent Body',
      1),
    new ContentChoice('0',
      '1',
      'roomId4',
      'LikertContent Subject',
      'LikertContent Body',
      1,
      [
        new AnswerOption('Strongly agree', '0'),
        new AnswerOption('Agree', '0'),
        new AnswerOption('Neither agree nor disagree', '0'),
        new AnswerOption('Disagree', '0' ),
      new AnswerOption('Strongly disagree', '0') ],
      [],
      false,
      ContentType.SCALE)
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
