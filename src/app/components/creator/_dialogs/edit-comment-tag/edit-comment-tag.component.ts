import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SessionService } from '../../../../services/util/session.service';
import { TagsComponent } from '../tags/tags.component';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { NotificationService } from '../../../../services/util/notification.service';
import { RoomService } from '../../../../services/http/room.service';

@Component({
  selector: 'app-edit-comment-tag',
  templateUrl: './edit-comment-tag.component.html',
  styleUrls: ['./edit-comment-tag.component.scss']
})
export class EditCommentTagComponent implements OnInit {

  selectedTag: string;

  constructor(
    private dialogRef: MatDialogRef<EditCommentTagComponent>,
    public sessionInfo: SessionService,
    private dialog: MatDialog,
    private translateService: TranslateService,
    private langService: LanguageService,
    private notificationService: NotificationService,
    private roomService: RoomService,
  ) {
    langService.getLanguage().subscribe(lang => this.translateService.use(lang));
  }

  ngOnInit(): void {
  }

  openAllTags(): void {
    const dialogRef = this.dialog.open(TagsComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.tags = this.sessionInfo.currentRoom?.tags || [];
    dialogRef.afterClosed().subscribe(result => {
      if (!result || result === 'abort') {
        return;
      }
      const room = this.sessionInfo.currentRoom;
      const previous = room.tags;
      room.tags = result;
      this.roomService.patchRoom(room.id, { tags: result }).subscribe({
        next: () => {
          this.translateService.get('room-page.changes-successful').subscribe(msg => {
            this.notificationService.show(msg);
          });
        },
        error: () => {
          room.tags = previous;
          this.translateService.get('room-page.changes-gone-wrong').subscribe(msg => {
            this.notificationService.show(msg);
          });
        }
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
