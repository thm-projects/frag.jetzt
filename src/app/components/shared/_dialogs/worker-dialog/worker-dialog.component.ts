import { Component, Injector, Input } from '@angular/core';
import { Room } from '../../../../models/room';
import { TSMap } from 'typescript-map';
import { WorkerDialogTask } from './worker-dialog-task';
import { Comment, Language } from '../../../../models/comment';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { uiComments } from 'app/room/state/comment-updates';

@Component({
  selector: 'app-worker-dialog',
  templateUrl: './worker-dialog.component.html',
  styleUrls: ['./worker-dialog.component.scss'],
  standalone: false,
})
export class WorkerDialogComponent {
  private static dialogRef: MatDialogRef<WorkerDialogComponent> = null;
  private static queuedRooms = new TSMap<string, WorkerDialogTask>();

  @Input() inlined = false;

  constructor(private injector: Injector) {}

  static isWorkingOnRoom(roomId: string) {
    if (!this.dialogRef) {
      return false;
    }
    return this.queuedRooms.has(roomId);
  }

  static addWorkTask(
    dialog: MatDialog,
    room: Room,
    onlyFailed = false,
  ): boolean {
    if (!this.dialogRef) {
      this.dialogRef = dialog.open(WorkerDialogComponent, {
        width: '200px',
        disableClose: true,
        autoFocus: false,
        position: { left: '50px', bottom: '150px' },
        role: 'dialog',
        hasBackdrop: false,
        closeOnNavigation: false,
        panelClass: 'workerContainer',
      });
      this.dialogRef.beforeClosed().subscribe(() => {
        for (const value of WorkerDialogComponent.queuedRooms.values()) {
          value.error = 'interrupt';
        }
        WorkerDialogComponent.queuedRooms.clear();
      });
    }
    if (this.queuedRooms.has(room.id)) {
      return false;
    }
    let comments = uiComments().rawComments.map((e) => e.comment);
    if (onlyFailed) {
      comments = comments.filter((c) => {
        const isKeywordOkay =
          c.keywordsFromSpacy && c.keywordsFromSpacy.length > 0;
        const isLanguageDefined = c.language !== Language.AUTO;
        let isKeywordWellDefined = false;
        if (isKeywordOkay) {
          isKeywordWellDefined = c.keywordsFromSpacy.every((keyword) => {
            const keys = Object.keys(keyword);
            return (
              keys.length === 2 &&
              keys.indexOf('dep') >= 0 &&
              keys.indexOf('text') >= 0 &&
              Array.isArray(keyword.dep) &&
              typeof keyword.text === 'string' &&
              keyword.dep.every((str) => typeof str === 'string')
            );
          });
        }
        return !(isKeywordOkay && isKeywordWellDefined && isLanguageDefined);
      });
    }
    this.dialogRef.componentInstance.appendRoom(room, [...comments]);
    return true;
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

  getActiveRoomCount(): number {
    let count = 0;
    WorkerDialogComponent.queuedRooms.values().forEach((e) => {
      if (e.isRunning()) {
        ++count;
      }
    });
    return count;
  }

  appendRoom(room: Room, comments: Comment[]) {
    WorkerDialogComponent.queuedRooms.set(
      room.id,
      new WorkerDialogTask(
        room,
        comments,
        () => {
          setTimeout(() => {
            WorkerDialogComponent.queuedRooms.delete(room.id);
            if (WorkerDialogComponent.queuedRooms.length === 0) {
              this.close();
            }
          }, 10_000);
        },
        this.injector,
      ),
    );
  }

  close(): void {
    if (WorkerDialogComponent.dialogRef) {
      WorkerDialogComponent.dialogRef.close();
      WorkerDialogComponent.dialogRef = null;
    }
  }
}
