import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoomService } from '../room.service';
import { Content } from '../content';
import { ContentService } from '../content.service';
import { ContentAnswerService } from '../content-answer.service';
import { AnswerText } from '../answer-text';

@Component({
  selector: 'app-answer-statistics',
  templateUrl: './answer-statistics.component.html',
  styleUrls: ['./answer-statistics.component.scss']
})
export class AnswerStatisticsComponent implements OnInit {
  @Input() content: Content[];
  @Input() answers: AnswerText[] = [];
  statistics: any = null;
  states = [
    { value: '1', viewValue: 'Responded' },
    { value: '2', viewValue: 'Not responded' },
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
      this.contentAnswerService.getAnswerTexts(question.id).subscribe( answer => [].push.apply(this.answers, answer));
    }
  }

  showStatistic(value) {
    console.log(this.answers);
    this.statistics = [];
    for (const question of this.content) {
      this.statistics.push( {
        name: question.subject, votes: '10', percent: '10',
      });
    }
    this.selected = value;
  }
}
