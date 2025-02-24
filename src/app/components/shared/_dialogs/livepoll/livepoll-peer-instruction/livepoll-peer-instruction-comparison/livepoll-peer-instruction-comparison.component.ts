import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LivepollSession } from '../../../../../../models/livepoll-session';
import {
  LivepollTemplateContext,
  templateEntries,
} from '../../../../../../models/livepoll-template';
import { LivepollComponentUtility } from '../../livepoll-component-utility';
import { LivepollService } from '../../../../../../services/http/livepoll.service';
import { LivepollOptionEntry } from '../../livepoll-dialog/livepoll-dialog.component';

export interface LivepollComparison {
  livepollSession: LivepollSession;
  options: LivepollOptionEntry[];
  votes: number[];
  rowHeight: number;
  template: LivepollTemplateContext;
  get totalVotes(): number;
}

@Component({
  selector: 'app-livepoll-peer-instruction-comparison',
  templateUrl: './livepoll-peer-instruction-comparison.component.html',
  styleUrls: [
    './livepoll-peer-instruction-comparison.component.scss',
    '../../livepoll-common.scss',
  ],
  standalone: false,
})
export class LivepollPeerInstructionComparisonComponent {
  protected readonly comparisonList: LivepollComparison[] = [];

  constructor(
    public readonly livepollService: LivepollService,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: [LivepollSession, LivepollSession],
  ) {
    for (let i = 0; i < this.data.length; i++) {
      const obj = {
        rowHeight: 0,
        template: templateEntries[this.data[i].template],
        livepollSession: this.data[i],
        options: [],
        votes: [],
      };
      LivepollComponentUtility.initTemplate(obj);
      this.livepollService.getResults(this.data[i].id).subscribe((results) => {
        for (let j = 0; j < results.length; j++) {
          obj.votes[j] = results[j];
        }
        this.comparisonList[i] = {
          ...obj,
          ...{
            get totalVotes(): number {
              return obj.votes && obj.votes.length > 0
                ? obj.votes.reduce((p, c) => p + c)
                : 1;
            },
          },
        };
      });
    }
  }
}
