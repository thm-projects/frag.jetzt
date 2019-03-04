import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { ContentService } from '../../../services/http/content.service';
import { ContentChoice } from '../../../models/content-choice';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

export class AnswerList {
  label: string;
  answer: string;

  constructor(label: string, answer: string) {
    this.label = label;
    this.answer = answer;
  }
}

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss']
})
export class StatisticComponent implements OnInit {

  chart = Chart;
  colors: string[] = [];     /* ['rgba(33,150,243, 0.8)', 'rgba(76,175,80, 0.8)', 'rgba(255,235,59, 0.8)', 'rgba(244,67,54, 0.8)',
                                 'rgba(96,125,139, 0.8)', 'rgba(63,81,181, 0.8)', 'rgba(233,30,99, 0.8)', 'rgba(121,85,72, 0.8)']; */
  ccolors: string[] = [];
  label = 'ABCDEFGH';
  labels: string[]; // = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  answers: string[];
  answerList: AnswerList[];
  data: number[];
  contentId: string;
  subject: string;
  maxLength: number;
  isLoading = true;
  showsCorrect = false;

  constructor(protected route: ActivatedRoute,
              private contentService: ContentService,
              private translateService: TranslateService,
              protected langService: LanguageService) {
              langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    window.scroll(0, 0); // Maybe not so bad without header..
    this.translateService.use(localStorage.getItem('currentLang'));
    this.maxLength = innerWidth / 12;
    this.answers = new Array<string>();
    this.labels = new Array<string>();
    this.answerList = new Array<AnswerList>();
    this.data = new Array<number>();
    this.route.params.subscribe(params => {
      this.contentId = params['contentId'];
    });
    this.contentService.getChoiceContent(this.contentId).subscribe(content => {
      this.getData(content);
      this.isLoading = false;
    });
  }

  createChart(colors: string[]) {
    this.chart = new Chart('chart', {
      type: 'bar',
      data: {
        labels: this.labels,
        datasets: [{
          data: this.data,
          backgroundColor: colors
        }]
      },
      options: {
        legend: {
          display: false
        },
        tooltips: {
          mode: 'index'
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
  }

  switchAnswers() {
    if (this.showsCorrect === false) {
      this.showCorrect();
    } else {
      this.showNormal();
    }
  }

  showCorrect() {
    this.createChart(this.ccolors);
    this.showsCorrect = true;
  }

  showNormal() {
    this.createChart(this.colors);
    this.showsCorrect = false;
  }

  getData(content: ContentChoice) {
    this.subject = content.subject;
    const length = content.options.length;
    for (let i = 0; i < length; i++) {
      this.answerList[i] = new AnswerList(null, null);
      this.labels[i] = this.label.charAt(i);
      this.answerList[i].label = this.labels[i];
      if (content.options[i].label.length > this.maxLength) {
        this.answerList[i].answer = content.options[i].label.substr(0, this.maxLength) + '..';
      } else {
        this.answerList[i].answer = content.options[i].label;
      }
      if (i % 2 === 0) {
        this.colors[i] = 'rgba(255,224,130, 1.0)';
      } else {
        this.colors[i] = 'rgba(128,203,196, 1.0)';
      }
      if (content.options[i].points <= 0) {
        this.ccolors[i] = 'rgba(244,67,54, 0.8)';
      } else {
        this.ccolors[i] = 'rgba(76,175,80, 0.8)';
      }
    }
    this.contentService.getAnswer(content.id).subscribe(answer => {
      this.data = answer.roundStatistics[0].independentCounts;
      this.data.push(answer.roundStatistics[0].abstentionCount);
      if (this.data[this.data.length - 1] > 0) {
        this.ccolors.push('rgba(189,189,189, 0.8)');
        this.colors.push('rgba(189,189,189, 0.8)');
        this.translateService.get('statistic.abstentions').subscribe(label => {
          this.labels.push(label);
        });
      }
      this.createChart(this.colors);
    });
  }
}
