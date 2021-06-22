import { Component, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { CommentService } from '../../../../services/http/comment.service';
import { SpacyService } from '../../../../services/http/spacy.service';
import { TSMap } from 'typescript-map';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { WorkerDialogTask } from './worker-dialog-task';
import { LanguagetoolService } from '../../../../services/http/languagetool.service';

@Component({
  selector: 'app-worker-dialog',
  templateUrl: './worker-dialog.component.html',
  styleUrls: ['./worker-dialog.component.scss']
})
export class WorkerDialogComponent implements OnInit {

  private static dialogRef: MatDialogRef<WorkerDialogComponent> = null;
  private static queuedRooms = new TSMap<string, WorkerDialogTask>();

  constructor(private commentService: CommentService,
              private languagetoolService: LanguagetoolService,
              private spacyService: SpacyService) {
  }

  static addWorkTask(dialog: MatDialog, room: Room): boolean {
    if (!this.dialogRef) {
      this.dialogRef = dialog.open(WorkerDialogComponent, {
        width: '200px',
        disableClose: true,
        autoFocus: false,
        position: {left: '50px', bottom: '50px'},
        role: 'dialog',
        hasBackdrop: false,
        closeOnNavigation: false,
        panelClass: 'workerContainer'
      });
      this.dialogRef.beforeClosed().subscribe(_ => {
        for (const value of WorkerDialogComponent.queuedRooms.values()) {
          value.error = 'interrupt';
        }
        WorkerDialogComponent.queuedRooms.clear();
      });
    }
    if (this.queuedRooms.has(room.id)) {
      return false;
    }
    this.dialogRef.componentInstance.appendRoom(room);
    return true;
  }

  ngOnInit(): void {
  }

  checkTasks(event: BeforeUnloadEvent) {
    if (WorkerDialogComponent.queuedRooms.length > 0) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  getRooms() {
    return WorkerDialogComponent.queuedRooms;
  }

  appendRoom(room: Room) {
    WorkerDialogComponent.queuedRooms.set(room.id,
      new WorkerDialogTask(room, this.spacyService, this.commentService, this.languagetoolService, () => {
        if (WorkerDialogComponent.queuedRooms.length === 0) {
          setTimeout(() => this.close(), 2000);
        }
      })
    );
  }

  close(): void {
    if (WorkerDialogComponent.dialogRef) {
      WorkerDialogComponent.dialogRef.close();
      WorkerDialogComponent.dialogRef = null;
    }
  }

}

