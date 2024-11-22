import { Component, Inject, OnInit } from '@angular/core';
import { LivepollSession } from '../../../../../models/livepoll-session';
import { SessionService } from '../../../../../services/util/session.service';
import { LivepollComponentUtility } from '../livepoll-component-utility';
import {
  LivepollTemplateContext,
  templateEntries,
} from '../../../../../models/livepoll-template';
import { LivepollOptionEntry } from '../livepoll-dialog/livepoll-dialog.component';
import { LivepollService } from '../../../../../services/http/livepoll.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-livepoll-summary',
  templateUrl: './livepoll-summary.component.html',
  styleUrls: ['./livepoll-summary.component.scss', '../livepoll-common.scss'],
  standalone: false,
})
export class LivepollSummaryComponent implements OnInit {
  public votes: number[];
  public template: LivepollTemplateContext;
  public rowHeight: number;
  public options: LivepollOptionEntry[] | undefined;
  public readonly translateKey: string = 'common';
  public readonly livepollSession: LivepollSession;

  constructor(
    public readonly session: SessionService,
    public readonly livepollService: LivepollService,
    public readonly matDialogRef: MatDialogRef<LivepollSummaryComponent>,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: {
      peerInstruction: boolean;
      livepollSession: LivepollSession;
    },
  ) {
    this.livepollSession = data.livepollSession;
    this.template = templateEntries[this.livepollSession.template];
  }

  get totalVotes(): number {
    return this.votes && this.votes.length > 0
      ? this.votes.reduce((p, c) => p + c)
      : 1;
  }

  ngOnInit(): void {
    LivepollComponentUtility.initTemplate(this);
    this.livepollService
      .getResults(this.livepollSession.id)
      .subscribe((results) => {
        for (let i = 0; i < results.length; i++) {
          this.votes[i] = results[i];
        }
      });
  }

  protected startPeerInstruction2ndPhase() {
    this.matDialogRef.close(true);
  }

  protected abortPeerInstruction() {
    this.matDialogRef.close(false);
  }
}
