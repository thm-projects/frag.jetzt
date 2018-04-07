import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-feedback-barometer-page',
  templateUrl: './feedback-barometer-page.component.html',
  styleUrls: ['./feedback-barometer-page.component.scss']
})
export class FeedbackBarometerPageComponent implements OnInit {
  feedback: any = [
    { state: 'good', count: 0, },
    { state: 'ok', count: 0, },
    { state: 'not ok', count: 0, },
    { state: 'bad', count: 0, },
  ];

  constructor() { }

  ngOnInit() {
  }

}
