import { Component, OnInit } from '@angular/core';
import { ContentService } from '../../../services/http/content.service';
import { Content } from '../../../models/content';
import { ActivatedRoute } from '@angular/router';
import { ContentChoice } from '../../../models/content-choice';
import { ContentText } from '../../../models/content-text';
import { AnswerOption } from '../../../models/answer-option';
import { ContentType } from '../../../models/content-type.enum';

@Component({
  selector: 'app-content-list',
  templateUrl: './content-list.component.html',
  styleUrls: ['./content-list.component.scss']
})
export class ContentListComponent implements OnInit {
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
//      this.getContents(params['roomId']);
    });
  }

  getContents(roomId: string): void {
    this.contentService.getContents(roomId)
      .subscribe(contents => {
        this.contents = contents;
      });
  }
}
