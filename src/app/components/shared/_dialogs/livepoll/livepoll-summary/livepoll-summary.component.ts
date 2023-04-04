import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LivepollSession } from '../../../../../models/livepoll-session';
import { SessionService } from '../../../../../services/util/session.service';
import { LivepollComponentUtility } from '../livepoll-component-utility';
import {
  LivepollTemplateContext,
  templateEntries,
} from '../../../../../models/livepoll-template';
import { LivepollOptionEntry } from '../livepoll-dialog/livepoll-dialog.component';

@Component({
  selector: 'app-livepoll-summary',
  templateUrl: './livepoll-summary.component.html',
  styleUrls: ['./livepoll-summary.component.scss'],
})
export class LivepollSummaryComponent implements OnInit {
  public votes: number[];
  public template: LivepollTemplateContext;
  public rowHeight: number;
  public options: LivepollOptionEntry[] | undefined;
  public readonly translateKey: string = 'common';

  constructor(
    public readonly session: SessionService,
    @Inject(MAT_DIALOG_DATA) public readonly livepollSession: LivepollSession,
  ) {
    this.template = templateEntries[livepollSession.template];
  }

  get totalVotes(): number {
    return this.votes && this.votes.length > 0
      ? this.votes.reduce((p, c) => p + c)
      : 1;
  }

  ngOnInit(): void {
    LivepollComponentUtility.initTemplate(this);
  }
}
