import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Room } from '../../../../models/room';
import { WorkerDialogComponent } from '../worker-dialog/worker-dialog.component';

@Component({
  selector: 'app-worker-config-dialog',
  templateUrl: './worker-config-dialog.component.html',
  styleUrls: ['./worker-config-dialog.component.scss']
})
export class WorkerConfigDialogComponent implements OnInit {

  public selection = 'normal';

  constructor(
    private dialogRef: MatDialogRef<WorkerConfigDialogComponent>,
  ) {
  }

  public static addTask(dialog: MatDialog, room: Room) {
    dialog.open(WorkerConfigDialogComponent, {
      width: '900px',
      maxWidth: '100%'
    }).afterClosed().subscribe(data => {
      if (!data) {
        return;
      }
      WorkerDialogComponent.addWorkTask(dialog, room, data === 'only-failed');
    });
  }

  ngOnInit(): void {
  }

  buildConfirmAction() {
    return () => {
      this.dialogRef.close(this.selection);
    };
  }

  buildCancelAction() {
    return () => this.dialogRef.close();
  }

}
