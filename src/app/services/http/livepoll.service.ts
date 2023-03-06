import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../util/session.service';
import { MatDialog } from '@angular/material/dialog';
import { UserRole } from '../../models/user-roles.enum';
import { LivepollCreateComponent } from '../../components/shared/_dialogs/livepoll-create/livepoll-create.component';
import { LivepollDialogComponent } from '../../components/shared/_dialogs/livepoll-dialog/livepoll-dialog.component';

export interface LivepollSessionPatchAPI {
  template: string;
  title: string | null;
  resultVisible: boolean;
  viewsVisible: boolean;
  roomId: string;
}

@Injectable({
  providedIn: 'root',
})
export class LivepollService {
  constructor(
    public readonly http: HttpClient,
    public readonly sessionService: SessionService,
    public readonly dialog: MatDialog,
  ) {}

  create(livepoll: LivepollSessionPatchAPI) {
    this.http
      .post('/api/livepoll/session', livepoll, {
        headers: { 'Content-Type': 'application/json' },
      })
      .subscribe((x) => {});
  }

  patch(livepoll: LivepollSessionPatchAPI) {
    this.http.post('/api/livepoll/session', livepoll, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  open() {
    console.log(this.sessionService.currentRole);
    console.log(this.sessionService.currentLivepoll);
    switch (this.sessionService.currentRole) {
      case UserRole.PARTICIPANT:
        const instance = this.dialog.open(LivepollDialogComponent, {});
        instance.componentInstance.initFromSession();
        break;
      case UserRole.EDITING_MODERATOR:
      case UserRole.EXECUTIVE_MODERATOR:
      case UserRole.CREATOR:
        if (!this.sessionService.currentLivepoll) {
          this.dialog.open(LivepollCreateComponent, {});
        } else {
          const instance = this.dialog.open(LivepollDialogComponent, {});
          instance.componentInstance.initFromSession();
        }
        break;
    }
  }
}
