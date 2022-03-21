import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Router } from '@angular/router';
import { CommentService } from '../../../../services/http/comment.service';
import { BonusTokenService } from '../../../../services/http/bonus-token.service';
import { DeleteCommentsComponent } from '../delete-comments/delete-comments.component';
import { Room } from '../../../../models/room';
import { CommentSettings } from '../../../../models/comment-settings';
import { CommentSettingsDialog } from '../../../../models/comment-settings-dialog';
import { SessionService } from '../../../../services/util/session.service';

@Component({
  selector: 'app-comment-settings',
  templateUrl: './comment-settings.component.html',
  styleUrls: ['./comment-settings.component.scss']
})
export class CommentSettingsComponent implements OnInit {

  roomId: string;
  commentThreshold = -100;
  editRoom: Room;
  settingThreshold = false;
  enableCommentModeration = true;
  directSend = true;
  tagsEnabled = false;
  tags: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    public translationService: TranslateService,
    protected roomService: RoomService,
    public router: Router,
    public commentService: CommentService,
    private sessionService: SessionService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  ngOnInit() {
    if (this.editRoom.threshold !== null) {
      this.commentThreshold = this.editRoom.threshold;
      this.settingThreshold = !!this.editRoom.threshold;
    }
    this.tags = [];
    this.enableCommentModeration = this.editRoom.moderated;
    this.directSend = this.editRoom.directSend;
  }

  onSliderChange(event: any) {
    if (event.value) {
      this.commentThreshold = event.value;
    } else {
      this.commentThreshold = 0;
    }
  }


  openDeleteCommentDialog(): void {
    const dialogRef = this.dialog.open(DeleteCommentsComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.roomId = this.roomId;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteComments();
        }
      });
  }

  deleteComments(): void {
    this.translationService.get('room-page.comments-deleted').subscribe(msg => {
      this.notificationService.show(msg);
    });
    this.commentService.deleteCommentsByRoomId(this.roomId).subscribe();
  }

  closeDialog(): void {
    const commentSettings = new CommentSettings();
    commentSettings.roomId = this.roomId;
    commentSettings.directSend = this.directSend;
    const settingsReturn = new CommentSettingsDialog();

    this.editRoom.directSend = this.directSend;
    this.editRoom.threshold = this.settingThreshold ? this.commentThreshold : 0;

    // If moderation isn't enabled, the direct send is of no interest and shouldn't be updated to avoid confusion about missing comments
    if ((this.enableCommentModeration && !this.directSend) || this.directSend) {
      this.roomService.updateRoom(this.editRoom).subscribe();
      settingsReturn.directSend = this.directSend;
    }
    settingsReturn.enableModeration = this.enableCommentModeration;
    settingsReturn.enableThreshold = this.settingThreshold;
    settingsReturn.threshold = this.commentThreshold;
    this.dialogRef.close(settingsReturn);
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close('abort');
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildSaveActionCallback(): () => void {
    return () => this.closeDialog();
  }
}
