import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LivepollCreateComponent } from '../../components/shared/_dialogs/livepoll-create/livepoll-create.component';
import { LivepollConfiguration } from '../../models/livepoll-configuration';
import { SessionService } from '../util/session.service';

@Injectable({
  providedIn: 'root'
})
export class LivepollService {

  constructor(
    public readonly dialog: MatDialog,
    public readonly sessionService: SessionService
  ) {
  }

  create() {
    const dialogInstance: MatDialogRef<LivepollCreateComponent, LivepollConfiguration> = this.dialog
      .open(LivepollCreateComponent, {});
    dialogInstance.afterClosed().subscribe(event => {
      if (event) {
        // Live Poll got created. Send via HTTP
        this.sessionService.currentLivepoll;
      }
    });
  }

}
