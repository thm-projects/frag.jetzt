import { Component, Input, OnInit } from '@angular/core';
import { ContentGroup } from '../../../models/content-group';
import { ContentService } from '../../../services/http/content.service';
import { Content } from '../../../models/content';
import { ContentType } from '../../../models/content-type.enum';
import { AnswerOption } from '../../../models/answer-option';
import { ContentChoice } from '../../../models/content-choice';

export class ContentPercents {
  content: Content;
  percent: number;
  constructor(content: Content, percent: number) {
    this.content = content;
    this.percent = percent;
  }
}
@Component({
  selector: 'app-list-statistic',
  templateUrl: './list-statistic.component.html',
  styleUrls: ['./list-statistic.component.scss']
})

export class ListStatisticComponent implements OnInit {

  @Input() contentGroup: ContentGroup;
  contents: Content[] = [];
  percents: number[] = [];
  displayedColumns = ['content', 'percentage'];
  dataSource: ContentPercents[];
  total = 0;
  totalP = 0;
  correctCounts = 0;
  totalCounts = 0;
  contentCounter = 0;

  constructor(private contentService: ContentService) {
  }

  ngOnInit() {
    this.percents = [73, 87, 69, 92, 77];
    this.contentService.getContentChoiceByIds(this.contentGroup.contentIds).subscribe(contents => {
      this.getContents(contents);
    });
  }

  getContents(contents: ContentChoice[]) {
    this.contents = contents;
    const length = contents.length;
    this.dataSource = new Array<ContentPercents>(length);
    for (let i = 0; i < length; i++) {
      this.dataSource[i] = new ContentPercents(null, 0 );
      this.dataSource[i].content = this.contents[i];
      if (contents[i].format === ContentType.CHOICE) {
        this.contentService.getAnswer(contents[i].id).subscribe(answer => {
          const percent = this.getCountCorrect(contents[i].options, answer.roundStatistics[0].independentCounts);
          this.dataSource[i].percent = percent;
          if (percent >= 0) {
            console.log(percent);
            this.totalP += percent;
            this.total = this.totalP / this.contentCounter;
          }
        });
      } else {
        this.dataSource[i].percent = -1;
      }
    }
  }

  getCountCorrect(options: AnswerOption[], indCounts: number[]): number {
    let correctIndex;
    this.correctCounts = 0;
    this.totalCounts = 0;
    const length = options.length;
    let res: number;
    for (let i = 0; i < length; i++) {
      if (options[i].points > 0) {
        correctIndex = i;
      }
    }
    for (let i = 0; i < length; i++) {
      if (i === correctIndex) {
        this.correctCounts += indCounts[i];
      }
      this.totalCounts += indCounts[i];
    }
    if (this.totalCounts) {
      res = ((this.correctCounts / this.totalCounts) * 100);
      this.contentCounter++;
    } else {
      res = -1;
    }
    return res;
  }
}
