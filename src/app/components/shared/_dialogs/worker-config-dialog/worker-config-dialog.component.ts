import { Component } from '@angular/core';
import { Room } from '../../../../models/room';
import { WorkerDialogComponent } from '../worker-dialog/worker-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-worker-config-dialog',
  templateUrl: './worker-config-dialog.component.html',
  styleUrls: ['./worker-config-dialog.component.scss'],
})
export class WorkerConfigDialogComponent {
  public selection = 'normal';

  constructor() {}

  public static addTask(dialog: MatDialog, room: Room) {
    dialog
      .open(WorkerConfigDialogComponent, {
        width: '900px',
        maxWidth: '100%',
      })
      .afterClosed()
      .subscribe((data) => {
        if (!data) {
          return;
        }
        WorkerDialogComponent.addWorkTask(dialog, room, data === 'only-failed');
      });
  }
}
