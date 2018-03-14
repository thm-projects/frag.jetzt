import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-answer-statistics',
  templateUrl: './answer-statistics.component.html',
  styleUrls: ['./answer-statistics.component.scss']
})
export class AnswerStatisticsComponent implements OnInit {
  states = [
    { value: '1', viewValue: 'Responded' },
    { value: '2', viewValue: 'Not responded' },
  ];
  selected: number = null;

  constructor() { }

  ngOnInit() {
  }

  showStatistic(value) {
    this.selected = value;
  }
}
