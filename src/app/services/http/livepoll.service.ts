import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LivepollCreateComponent } from '../../components/shared/_dialogs/livepoll-create/livepoll-create.component';
import { LivepollConfiguration } from '../../models/livepoll-configuration';
import { SessionService } from '../util/session.service';
import { Livepoll } from '../../models/livepoll';
import { LivepollVoteComponent } from '../../components/shared/_dialogs/livepoll-vote/livepoll-vote.component';

@Injectable({
  providedIn: 'root'
})
export class LivepollService {

  constructor(
    public readonly dialog: MatDialog,
    public readonly sessionService: SessionService
  ) {
    let pollTrigger: boolean = false;
    setInterval(() => {
      if (this.sessionService.currentRole === 0) {
        if (sessionService.currentLivepoll.hasActiveLivepoll()) {
          if (!pollTrigger) {
            pollTrigger = true;
            this.openVoteDialog();
          }
        }
      }
    }, 1000);
  }

  openVoteDialog() {
    const dialogInstance: MatDialogRef<LivepollVoteComponent> = this.dialog.open(LivepollVoteComponent, {});
  }

  create() {
    const dialogInstance: MatDialogRef<LivepollCreateComponent, LivepollConfiguration> = this.dialog
      .open(LivepollCreateComponent, {});
    dialogInstance.afterClosed().subscribe(event => {
      if (event) {
        event.isLive = true;
        this.sessionService.currentLivepoll.polls.push(new Livepoll(event, [], new Date()));
        // Live Poll got created. Send via HTTP
      }
    });
  }

}
