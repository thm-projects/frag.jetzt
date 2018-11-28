import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../../../services/http/room.service';
import { Content } from '../../../models/content';
import { ContentService } from '../../../services/http/content.service';
import { ContentGroup } from '../../../models/content-group';
import { Room } from '../../../models/room';

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

  contents: string[] = ['TEST', 'TEST'];
  room: Room;
  contentGroups: ContentGroup[];
  contentGroup: ContentGroup = new ContentGroup('Choice', ['53d8dc160260a1724b7c9930ed00102c', '53d8dc160260a1724b7c9930ed000b38'], true);
  percents: number[];
  displayedColumns = ['content', 'percentage'];
  dataSource: ContentPercents[] = [
    { content: '', percent: '' },
    { content: '', percent: '' },
    { content: '', percent: '' }
  ];

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private contentService: ContentService) {
  }

  ngOnInit(): void {
    this.getRoom(localStorage.getItem('roomId'));
    this.getContents();
    this.percents = [73, 87, 69, 92, 77];
    for (let i = 0; i < 2; i++) {
      this.dataSource[i].content = this.contents[i];
      this.dataSource[i].percent = this.percents[i].toFixed(0);
    }
  }

  getRoom(id: string): void {
    this.roomService.getRoom(id).subscribe(room => {
      this.contentGroups = room.contentGroups;
    });
  }

  getContents(): void {
  this.contentService.getContentsByIds(this.contentGroup.contentIds).subscribe( contents => {
    for (let i = 0; i < 2; i++) {
      this.contents[i] = contents[i].subject;
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
