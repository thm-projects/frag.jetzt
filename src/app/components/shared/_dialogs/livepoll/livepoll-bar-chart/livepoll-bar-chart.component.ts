import { Component, Input, OnInit } from '@angular/core';
import { LivepollOptionEntry } from '../livepoll-dialog/livepoll-dialog.component';
import { LivepollTemplateContext } from '../../../../../models/livepoll-template';

export interface ExtendedLivepollOptionEntry extends LivepollOptionEntry {
  height: number;
}

@Component({
  selector: 'app-livepoll-bar-chart',
  templateUrl: './livepoll-bar-chart.component.html',
  styleUrls: ['./livepoll-bar-chart.component.scss'],
})
export class LivepollBarChartComponent implements OnInit {
  @Input() mode: 'compare' | 'single';
  @Input() options: LivepollOptionEntry[][];
  @Input() votes: number[][];
  @Input() templates: LivepollTemplateContext[];

  constructor() {}

  get maxVotes() {
    return this.votes
      .map((x) => x.reduce((a, b) => a + b, 0))
      .reduce((a, b) => Math.max(a, b));
  }

  get length(): number {
    return this.options
      .map((x) => x.length)
      .reduce((a, b) => Math.max(a, b), 0);
  }

  get indices(): number[] {
    return new Array(this.length).fill(null);
  }

  ngOnInit(): void {}

  getOptions(index: number) {
    const collect: (LivepollOptionEntry | null)[] = [];
    let prev: LivepollOptionEntry | undefined;
    for (const item of this.options) {
      const target = item[index];
      if (target) {
        if (prev && target.symbol === prev.symbol) {
          collect.push(null);
        } else {
          collect.push(target);
        }
        prev = target;
      } else {
        collect.push(null);
      }
    }
    return collect;
  }

  getVotes(index: number) {
    const collect: number[] = [];
    for (let i = 0; i < this.options.length; i++) {
      collect.push(this.votes[i][index] || 0);
    }
    return collect;
  }

  public getVotePercentage(x: number, y: number) {
    return Math.floor(
      this.votes[y][x] ? (this.votes[y][x] / this.maxVotes) * 100 : 0,
    );
  }
}
