import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss']
})
export class StatisticComponent implements OnInit {

  chartOptions = {
    scaleShowVerticalLines: false,
    responsive: true
  };

  chartLabels = ['a', 'b', 'c', 'd'];
  chartType = 'bar';
  chartLegend = true;

  chartData = [
    { data: [12, 30, 43, 32], label: 'dataOne' },
    { data: [8, 20, 33, 12], label: 'dataTwo' }
  ];

  constructor() { }

  ngOnInit() {
  }

}
