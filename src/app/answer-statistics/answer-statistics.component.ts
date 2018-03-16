import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../room.service';
import { Content } from '../content';
import { ContentService } from '../content.service';
import { ContentAnswerService } from '../content-answer.service';
import { AnswerText } from '../answer-text';
import { ChoiceAnswer } from '../choice-answer';
import { ContentType } from '../content-type';

@Component({
  selector: 'app-answer-statistics',
  templateUrl: './answer-statistics.component.html',
  styleUrls: ['./answer-statistics.component.scss']
})
export class AnswerStatisticsComponent implements OnInit {
  @Input() content: Content[];
  @Input() textAnswers: AnswerText[] = [];
  @Input() choiceAnswers: ChoiceAnswer[] = [];
  statistics: any = null;
  selectedContent: any = {
    name: 'HOW TO MAKE CONTENT GREAT AGAIN',
    index: '1',
    length: '1'
  };
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
    for (const question of this.content) {
      this.contentAnswerService.getTextAnswers(question.contentId).subscribe( answer => {
        [].push.apply(this.textAnswers, answer);
      });
      this.contentAnswerService.getChoiceAnswers(question.contentId).subscribe( answer => {
        [].push.apply(this.choiceAnswers, answer);
      });
    }
  }

  showStatistic(value) {  /** refactor answer class structure for less code and more abstraction*/
    this.statistics = [];
    for (const question of this.content) {
      if (value === '1') {
        if (question.format === ContentType.TEXT) {
          const count = this.countTextAnswers(question.contentId);
          this.statistics.push({
            name: question.subject, answers: count, percent: count * 100 / this.textAnswers.length,
          });
        }
      } else {
        if (question.format === ContentType.CHOICE) {
          const count = this.countChoiceAnswers(question.contentId);
          this.statistics.push({
            name: question.subject, answers: count, percent: count * 100 / this.choiceAnswers.length,
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
    /** coming with api connection, logic doesnt make sense without knowledge about api **/
  }
}
