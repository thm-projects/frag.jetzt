import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../../../services/http/room.service';
import { Content } from '../../../models/content';
import { ContentService } from '../../../services/http/content.service';
import { ContentGroup } from '../../../models/content-group';

/* TODO: Use TranslateService */
export interface ContentPercents {
  content: string;
  percent: string;
}

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})

export class StatisticsComponent implements OnInit {

  contents: Content[] = [];
  contentGroups: ContentGroup[] = [];
  contentGroup: ContentGroup;
  percents: number[] = [73, 87, 69, 92, 77];
  displayedColumns: string[] = ['content', 'percentage'];
  dataSource: ContentPercents[] = [];

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private contentService: ContentService) {
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.roomService.getRoomByShortId(params['roomId']).subscribe(room => {
        this.contentGroups = room.contentGroups;
      });
    });
    this.getContents();
    const contentLength = this.contents.length;
    for (let i = 0; i < contentLength - 1; i++) {
      this.dataSource[i].content = this.contents[i].subject;
      this.dataSource[i].percent = this.percents[i].toFixed(0);
    }
  }

  getContents(): void {
  this.contentService.getContentsByIds(this.contentGroup.contentIds).subscribe( contents => {
      console.log(contents.length);
      const contentLength: number = contents.length;
      for (let j = 0; j < contentLength - 1; j++) {
        console.log(contents[j].subject);
        console.log(j);
        this.contents[j].subject = contents[j].subject;
        this.contents[j].id = contents[j].id;
      }
    });
  }

}
  /*

  getAnswers(): void {
    for (const c of this.contents) {
      this.contentAnswerService.getAnswers(c.id).subscribe( answer => {
        [].push.apply(this.textAnswers, answer);
      });
      this.contentAnswerService.getAnswers(c.id).subscribe( answer => {
        [].push.apply(this.choiceAnswers, answer);
      });
    }
  }

  showStatistic(value) {  // refactor answer class structure for less code and more abstraction
    this.statistics = [];
    for (const c of this.contents) {
      if (value === '1') {
        if (c.format === ContentType.TEXT) {
          const count = this.countTextAnswers(c.id);
          this.statistics.push({
            name: c.subject, answers: count, percent: count * 100 / this.textAnswers.length,
          });
        }
      } else {
        if (c.format === ContentType.CHOICE) {
          const count = this.countChoiceAnswers(c.id);
          this.statistics.push({
            name: c.subject, answers: count, percent: count * 100 / this.choiceAnswers.length,
          });
        }
      }
    }
    this.selected = value;
  }

  countTextAnswers(contentId: string): number {
    return this.textAnswers.filter(answer => answer.contentId === contentId).length;
  }

  countChoiceAnswers(contentId: string): number {
    return this.choiceAnswers.filter(answer => answer.contentId === contentId).length;
  }

  showEvaluation(index: number) {
    // coming with api connection, logic doesnt make sense without knowledge about api
  }
*/
