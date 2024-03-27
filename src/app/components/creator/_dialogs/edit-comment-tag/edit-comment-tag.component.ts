import { Component, OnDestroy, OnInit } from '@angular/core';
import { SessionService } from '../../../../services/util/session.service';
import { TagsComponent } from '../tags/tags.component';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { RoomService } from '../../../../services/http/room.service';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { UserRole } from 'app/models/user-roles.enum';
import { ReplaySubject, takeUntil } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-comment-tag',
  templateUrl: './edit-comment-tag.component.html',
  styleUrls: ['./edit-comment-tag.component.scss'],
})
export class EditCommentTagComponent implements OnInit, OnDestroy {
  selectedTag: string;
  role: UserRole;
  private destroyer = new ReplaySubject<boolean>(1);

  constructor(
    private dialogRef: MatDialogRef<EditCommentTagComponent>,
    public sessionInfo: SessionService,
    private dialog: MatDialog,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private roomService: RoomService,
    private roomState: RoomStateService,
  ) {}

  ngOnInit(): void {
    this.roomState.assignedRole$
      .pipe(takeUntil(this.destroyer))
      .subscribe((role) => (this.role = ROOM_ROLE_MAPPER[role] || 0));
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  openAllTags(): void {
    const dialogRef = this.dialog.open(TagsComponent, {
      width: '400px',
    });
    dialogRef.componentInstance.tags = this.sessionInfo.currentRoom?.tags || [];
    dialogRef.afterClosed().subscribe((result) => {
      if (!result || result === 'abort') {
        return;
      }
      const room = this.sessionInfo.currentRoom;
      const previous = room.tags;
      room.tags = result;
      this.roomService.patchRoom(room.id, { tags: result }).subscribe({
        next: () => {
          this.translateService
            .get('room-page.changes-successful')
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });
        },
        error: () => {
          room.tags = previous;
          this.translateService
            .get('room-page.changes-gone-wrong')
            .subscribe((msg) => {
              this.notificationService.show(msg);
            });
        },
      });
    });
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }

  buildSaveActionCallback(): () => void {
    return () => this.dialogRef.close(this.selectedTag);
  }
}
