import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../../../services/http/room.service';
import { Content } from '../../../models/content';
import { ContentService } from '../../../services/http/content.service';
import { ContentAnswerService } from '../../../services/http/content-answer.service';
import { AnswerText } from '../../../models/answer-text';
import { AnswerChoice } from '../../../models/answer-choice';
import { ContentType } from '../../../models/content-type.enum';

/* TODO: Use TranslateService */

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  @Input() content: Content[];
  @Input() textAnswers: AnswerText[] = [];
  @Input() choiceAnswers: AnswerChoice[] = [];
  statistics: any = null;
  selectedContent: any = { name: 'HOW TO MAKE CONTENT GREAT AGAIN', index: '1', length: '1' };
  evaluation: any = [
    { name: 'Skill', percent: 10, correct: false, answers: 1, },
    { name: 'Knowledge', percent: 10, correct: false, answers: 1, },
    { name: '???', percent: 30, correct: true, answers: 3, },
    { name: 'Not at all', percent: 50, correct: true, answers: 5, }
    ];
  states = [
    { value: '1', viewValue: 'Text answers' },
    { value: '2', viewValue: 'Choice answers' }
  ];
  selected: number = null;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private contentService: ContentService,
    private contentAnswerService: ContentAnswerService ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.getContent(params['roomId']);
    });
  }

  getContent(roomId: string): void {
    this.contentService.getContents(roomId).subscribe(content => {
      this.content = content;
      this.getAnswers();
    });
  }

  getAnswers(): void {
    for (const c of this.content) {
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
    for (const c of this.content) {
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
}
