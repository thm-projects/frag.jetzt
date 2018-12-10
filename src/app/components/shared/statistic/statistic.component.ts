import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { Content } from '../../../models/content';

export class ContentStatistic {
  content: Content;
  contentId: string;
  percent: number;
  counts: number;
  abstentions: number;

  constructor(content: Content, contentId: string, percent: number, counts: number, abstentions: number) {
    this.content = content;
    this.contentId = contentId;
    this.percent = percent;
    this.counts = counts;
    this.abstentions = abstentions;
  }
}

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss']
})
export class StatisticComponent implements OnInit {

  chart = [];
  colors: string[] = ['rgba(33,150,243, 0.8)', 'rgba(76,175,80, 0.8)', 'rgba(255,235,59, 0.8)', 'rgba(244,67,54, 0.8)',
                      'rgba(96,125,139, 0.8)', 'rgba(63,81,181, 0.8)', 'rgba(233,30,99, 0.8)', 'rgba(121,85,72, 0.8)'];
  labels: string[] = ['a', 'b', 'c', 'd'];
  data: number[] = [12, 30, 43, 32];
  stats: ContentStatistic;
  roomId: string;

  constructor(protected route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.roomId = params['contentId'];
    });
    console.log(this.roomId);
    this.chart = new Chart('chart', {
      type: 'bar',
      data: {
        labels: this.labels,
        datasets: [{
          data: this.data,
          backgroundColor: this.colors
        }]
      },
      options: {
        legend: {
          display: false
        },
        responsive: true
      }
    });
  }
}
