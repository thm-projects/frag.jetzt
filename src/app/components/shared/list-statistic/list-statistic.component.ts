import { Component, Input, OnInit } from '@angular/core';
import { ContentGroup } from '../../../models/content-group';
import { ContentService } from '../../../services/http/content.service';
import { Content } from '../../../models/content';

export class ContentPercents {
  content: string;
  percent: string;

  constructor(content: string, percent: string) {
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

  constructor(private contentService: ContentService) {
  }

  ngOnInit() {
    this.percents = [73, 87, 69, 92, 77];
    this.contentService.getContentsByIds(this.contentGroup.contentIds).subscribe(contents => {
      this.getContents(contents);
    });
  }

  getContents(contents: Content[]) {
     this.contents = contents;
     const length = contents.length;
     this.dataSource = new Array<ContentPercents>(length);
     for (let i = 0; i < length; i++) {
      this.dataSource[i] = new ContentPercents('', '' );
      this.dataSource[i].content = this.contents[i].subject;
      this.dataSource[i].percent = this.percents[i].toFixed(0);
    }
  }

}
