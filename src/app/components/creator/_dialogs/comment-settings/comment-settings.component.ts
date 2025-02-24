import { Component, Inject, Input, OnInit } from '@angular/core';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Router } from '@angular/router';
import { CommentService } from '../../../../services/http/comment.service';
import { Room } from '../../../../models/room';
import { CommentSettingsDialog } from '../../../../models/comment-settings-dialog';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

@Component({
  selector: 'app-comment-settings',
  templateUrl: './comment-settings.component.html',
  styleUrls: ['./comment-settings.component.scss'],
  standalone: false,
})
export class CommentSettingsComponent implements OnInit {
  @Input() editRoom: Readonly<Room>;
  settingThreshold = false;
  commentThreshold = -100;
  directSend = true;

  constructor(
    public dialogRef: MatDialogRef<CommentSettingsComponent>,
    public dialog: MatDialog,
    public notificationService: NotificationService,
    public translationService: TranslateService,
    protected roomService: RoomService,
    public router: Router,
    public commentService: CommentService,
    @Inject(MAT_DIALOG_DATA) public data: object,
  ) {}

  ngOnInit() {
    if (this.editRoom.threshold !== null) {
      this.commentThreshold = this.editRoom.threshold;
      this.settingThreshold = !!this.editRoom.threshold;
    }
    this.directSend = this.editRoom.directSend;
  }

  onSliderChange(event: { value: number }) {
    if (event.value) {
      this.commentThreshold = event.value;
    } else {
      this.commentThreshold = 0;
    }
  }

  closeDialog(): void {
    this.dialogRef.close(
      new CommentSettingsDialog(
        this.settingThreshold ? this.commentThreshold : 0,
        this.directSend,
      ),
    );
  }
}
