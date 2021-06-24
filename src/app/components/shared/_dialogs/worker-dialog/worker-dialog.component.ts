import { Component, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { CommentService } from '../../../../services/http/comment.service';
import { SpacyService } from '../../../../services/http/spacy.service';
import { TSMap } from 'typescript-map';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { WorkerDialogTask } from './worker-dialog-task';
import { LanguagetoolService } from '../../../../services/http/languagetool.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { Comment } from '../../../../models/comment';
import { RoomDataService } from '../../../../services/util/room-data.service';

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
              private spacyService: SpacyService,
              protected langService: LanguageService,
              private translateService: TranslateService,
              private roomDataService: RoomDataService) {
    langService.langEmitter.subscribe(lang => translateService.use(lang));
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
    this.dialogRef.componentInstance.appendRoom(room, this.dialogRef.componentInstance.roomDataService.currentRoomData);
    return true;
  }

  ngOnInit(): void {
    this.translateService.use(localStorage.getItem('currentLang'));
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
    WorkerDialogComponent.queuedRooms.values().forEach(e => {
      if (e.isRunning()) {
        ++count;
      }
    });
    return count;
  }

  appendRoom(room: Room, comments: Comment[]) {
    WorkerDialogComponent.queuedRooms.set(room.id,
      new WorkerDialogTask(room, comments, this.spacyService, this.commentService, this.languagetoolService, () => {
        setTimeout(() => {
          WorkerDialogComponent.queuedRooms.delete(room.id);
          if (WorkerDialogComponent.queuedRooms.length === 0) {
            this.close();
          }
        }, 10_000);
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

