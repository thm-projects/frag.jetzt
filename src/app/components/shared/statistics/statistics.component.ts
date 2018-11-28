import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../../../services/http/room.service';
import { ContentGroup } from '../../../models/content-group';
import { Room } from '../../../models/room';

/* TODO: Use TranslateService */

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})

export class StatisticsComponent implements OnInit {

  room: Room;
  contentGroups: ContentGroup[];

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService) {
  }

  ngOnInit(): void {
    this.getRoom(localStorage.getItem('roomId'));
  }

  getRoom(id: string): void {
    this.roomService.getRoom(id).subscribe(room => {
      this.contentGroups = room.contentGroups;
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
