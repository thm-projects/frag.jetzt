import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../util/session.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UserRole } from '../../models/user-roles.enum';
import { LivepollCreateComponent } from '../../components/shared/_dialogs/livepoll-create/livepoll-create.component';
import { LivepollDialogComponent } from '../../components/shared/_dialogs/livepoll-dialog/livepoll-dialog.component';
import { DialogConfig } from '@angular/cdk/dialog';
import { RoomService } from './room.service';

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
  public static readonly dialogDefaults: MatDialogConfig = {
    width: '700px',
  };
  constructor(
    public readonly http: HttpClient,
    public readonly sessionService: SessionService,
    public readonly roomService: RoomService,
    public readonly dialog: MatDialog,
  ) {
    sessionService.onReady.subscribe(() => {
      sessionService.receiveRoomUpdates(false).subscribe((x) => {
        console.log('UPDATE', x);
      });
    });
    // mockup, remove when backend implemented
    // let ref: string | undefined
    // setInterval(()=>{
    //   const currentLivepoll = this.sessionService.currentLivepoll;
    //   if (!ref || ref !== JSON.stringify(currentLivepoll)) {
    //     console.log(currentLivepoll);
    //     ref = JSON.stringify(currentLivepoll);
    //   }
    // },100)
  }

  create(livepoll: LivepollSessionPatchAPI) {
    this.http
      .post(
        '/api/livepoll/session',
        {
          viewsVisible: livepoll.viewsVisible,
          resultVisible: livepoll.resultVisible,
          title: livepoll.title,
          roomId: livepoll.roomId,
          template: livepoll.template,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      )
      .subscribe((x) => {
        console.log('create', x);
      });
  }

  update(livepoll: LivepollSessionPatchAPI) {
    this.roomService
      .patchRoom(this.sessionService.currentRoom.id, {
        livepollSession: this.sessionService.currentLivepoll,
      })
      .subscribe((x) => {
        console.log('upt', x);
      });
  }

  open() {
    switch (this.sessionService.currentRole) {
      case UserRole.PARTICIPANT:
        const instance = this.dialog.open(
          LivepollDialogComponent,
          LivepollService.dialogDefaults,
        );
        instance.componentInstance.initFromSession();
        break;
      case UserRole.EDITING_MODERATOR:
      case UserRole.EXECUTIVE_MODERATOR:
      case UserRole.CREATOR:
        if (!this.sessionService.currentLivepoll) {
          this.dialog.open(
            LivepollCreateComponent,
            LivepollService.dialogDefaults,
          );
        } else {
          const instance = this.dialog.open(
            LivepollDialogComponent,
            LivepollService.dialogDefaults,
          );
          instance.componentInstance.initFromSession();
        }
        break;
    }
  }
}
