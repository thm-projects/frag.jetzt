import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { Content } from '../../../models/content';
import { ContentService } from '../../../services/http/content.service';
import { ContentChoice } from '../../../models/content-choice';

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
  labels: string[];
  data: number[];
  stats: ContentStatistic;
  contentId: string;
  subject: string;

  constructor(protected route: ActivatedRoute,
              private contentService: ContentService) { }

  ngOnInit() {
    this.labels = new Array<string>();
    this.data = new Array<number>();
    this.route.params.subscribe(params => {
      this.contentId = params['contentId'];
    });
    this.contentService.getChoiceContent(this.contentId).subscribe(content => {
      this.getData(content);
    });
  }

  getData(content: ContentChoice) {
    this.subject = content.subject;
    const length = content.options.length;
    for (let i = 0; i < length; i++) {
      this.labels[i] = content.options[i].label;
    }
    this.contentService.getAnswer(content.id).subscribe(answer => {
      this.data = answer.roundStatistics[0].independentCounts;
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
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true,
                precision: 0
              }
            }]
          }
        }
      });
    });
  }
}
