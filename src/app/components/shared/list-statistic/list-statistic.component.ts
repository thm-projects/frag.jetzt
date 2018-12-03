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
          const percent = this.getCountCorrect(contents[i].options, answer.roundStatistics[0].independentCounts, contents[i].multiple);
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

  getCountCorrect(options: AnswerOption[], indCounts: number[], multiple: boolean): number {
    this.correctCounts = 0;
    this.totalCounts = 0;
    const length = options.length;
    let correctIndex = new Array<number>();
    let res: number;
    if (multiple) {
      let cic = 0;
      let cac = 0;
      let idc = 0;
      for (let i = 0; i < length; i++) {
        if (options[i].points > 0) {
          correctIndex[cic] = i;
          cic++;
        }
      }
      for (let i = 0; i < length; i++) {
        if (correctIndex.includes(i)) {
          cac++;
        }
        idc = indCounts[i];
        if (cac === cic) {
          this.correctCounts += idc;
          cac = 0;
        }
        this.totalCounts += idc;
      }
    } else {
      for (let i = 0; i < length; i++) {
        if (options[i].points > 0) {
          correctIndex[0] = i;
        }
      }
      for (let i = 0; i < length; i++) {
        if (correctIndex.includes(i)) {
          this.correctCounts += indCounts[i];
        }
        this.totalCounts += indCounts[i];
      }
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
