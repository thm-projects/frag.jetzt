import { Component, Inject, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { RoomDeleteComponent } from '../room-delete/room-delete.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Router } from '@angular/router';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { DeleteCommentComponent } from '../delete-comment/delete-comment.component';
import { CommentService } from '../../../../services/http/comment.service';

@Component({
  selector: 'app-room-edit',
  templateUrl: './room-edit.component.html',
  styleUrls: ['./room-edit.component.scss']
})
export class RoomEditComponent implements OnInit {
  editRoom: Room;
  commentThreshold: number;

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              public dialog: MatDialog,
              public notificationService: NotificationService,
              public translationService: TranslateService,
              protected roomService: RoomService,
              public router: Router,
              public commentService: CommentService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    if (this.editRoom.extensions['comments'].commentThreshold != null) {
      this.commentThreshold = this.editRoom.extensions['comments'].commentThreshold;
    } else {
      this.commentThreshold = -10;
    }
  }

  onSliderChange(event: any) {
    if (event.value) {
      this.commentThreshold = event.value;
    } else {
      this.commentThreshold = 0;
    }
  }

  openDeleteRoomDialog(): void {
    const dialogRef = this.dialog.open(RoomDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.room = this.editRoom;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteRoom(this.editRoom);
        }
      });
  }

  deleteRoom(room: Room): void {
    this.translationService.get('room-page.deleted').subscribe(msg => {
      this.notificationService.show(room.name + msg);
    });
    this.roomService.deleteRoom(room.id).subscribe();
    this.dialogRef.close();
    this.router.navigate([`/creator`]);
  }

  openDeleteCommentDialog(): void {
    const dialogRef = this.dialog.open(DeleteCommentComponent, {
      width: '400px'
    });
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
    this.commentService.deleteCommentsByRoomId(this.editRoom.id).subscribe();
  }
}
