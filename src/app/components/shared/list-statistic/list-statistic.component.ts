import { Component, Input, OnInit } from '@angular/core';
import { ContentGroup } from '../../../models/content-group';
import { ContentService } from '../../../services/http/content.service';
import { Content } from '../../../models/content';
import { ContentType } from '../../../models/content-type.enum';
import { AnswerOption } from '../../../models/answer-option';
import { ContentChoice } from '../../../models/content-choice';
import { Combination } from '../../../models/round-statistics';

export class ContentPercents {
  content: Content;
  percent: number;
  counts: number;
  abstentions: number;

  constructor(content: Content, percent: number, counts: number, abstentions: number) {
    this.content = content;
    this.percent = percent;
    this.counts = counts;
    this.abstentions = abstentions;
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
  displayedColumns = ['content', 'counts', 'abstentions', 'percentage'];
  statusGood = 85;
  statusOkay = 50;
  statusEmpty = -1;
  statusZero = 0;
  dataSource: ContentPercents[];
  total = 0;
  totalP = 0;
  contentCounter = 0;

  constructor(private contentService: ContentService) {
  }

  ngOnInit() {
    this.contentService.getContentChoiceByIds(this.contentGroup.contentIds).subscribe(contents => {
      this.getData(contents);
    });
  }

  getData(contents: ContentChoice[]) {
    this.contents = contents;
    const length = contents.length;
    let percent;
    this.dataSource = new Array<ContentPercents>(length);
    for (let i = 0; i < length; i++) {
      this.dataSource[i] = new ContentPercents(null, 0, 0, 0 );
      this.dataSource[i].content = this.contents[i];
      if (contents[i].format === ContentType.CHOICE) {
        this.contentService.getAnswer(contents[i].id).subscribe(answer => {
          if (contents[i].multiple) {
            percent = this.evaluateMultiple(contents[i].options, answer.roundStatistics[0].combinatedCounts);
          } else {
            percent = this.evaluateSingle(contents[i].options, answer.roundStatistics[0].independentCounts);
          }
          this.dataSource[i].abstentions = answer.roundStatistics[0].abstentionCount;
          this.dataSource[i].counts = this.getTotalCounts(answer.roundStatistics[0].independentCounts);
          this.dataSource[i].percent = percent;
          if (percent >= 0) {
            this.totalP += percent;
            this.total = this.totalP / this.contentCounter;
          } else {
            this.total = -1;
          }
        });
      } else {
        this.dataSource[i].percent = -1;
      }
    }
  }

  getTotalCounts(indCounts: number[]): number {
    let total = 0;
    const indLength = indCounts.length;
    for (let i = 0; i < indLength; i++) {
      total += indCounts[i];
    }
    return total;
  }

  evaluateSingle(options: AnswerOption[], indCounts: number[]): number {
    let correctCounts = 0;
    let totalCounts = 0;
    const length = options.length;
    const correctIndex = new Array<number>();
    let res: number;
      for (let i = 0; i < length; i++) {
        if (options[i].points > 0) {
          correctIndex[0] = i;
        }
      }
      for (let i = 0; i < length; i++) {
        if (correctIndex.includes(i)) {
          correctCounts += indCounts[i];
        }
        totalCounts += indCounts[i];
      }
    if (totalCounts) {
      res = ((correctCounts / totalCounts) * 100);
      this.contentCounter++;
    } else {
      res = -1;
    }
    return res;
  }

  evaluateMultiple(options: AnswerOption[], combCounts: Combination[]): number {
    let combLength;
    if (combCounts) {
      combLength = combCounts.length;
    } else {
      return -1;
    }
    let correctCounts = 0;
    let totalCounts = 0;
    const optionsLength = options.length;
    const correctIndexes = new Array<number>();
    let res: number;
    let cic = 0;
    for (let i = 0; i < optionsLength; i++) {
      if (options[i].points > 0) {
        correctIndexes[cic] = i;
        cic++;
      }
    }
    for (let i = 0; i < combLength; i++) {
      if (combCounts[i].selectedChoiceIndexes.length === correctIndexes.length) {
        if (combCounts[i].selectedChoiceIndexes.toString() === correctIndexes.toString()) {
          correctCounts += combCounts[i].count;
        }
      }
      totalCounts += combCounts[i].count;
    }
    res = ((correctCounts / totalCounts) * 100);
    this.contentCounter++;
    return res;
  }
}
