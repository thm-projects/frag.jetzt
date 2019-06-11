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
import { CommentExportComponent } from '../comment-export/comment-export.component';
import { Comment } from '../../../../models/comment';

@Component({
  selector: 'app-room-edit',
  templateUrl: './room-edit.component.html',
  styleUrls: ['./room-edit.component.scss']
})
export class RoomEditComponent implements OnInit {
  editRoom: Room;
  comments: Comment[];
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
    if (
      this.editRoom.extensions &&
      this.editRoom.extensions['comments'] &&
      this.editRoom.extensions['comments'].commentThreshold != null
    ) {
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
    this.dialogRef.close('delete');
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

  exportCsv(delimiter: string, date: string): void {
    this.commentService.getComments(this.editRoom.id)
      .subscribe(comments => {
        this.comments = comments;
      });
    const exportComments = JSON.parse(JSON.stringify(this.comments));
    let csv: string;
    let keyFields = '';
    let valueFields = '';
    keyFields = Object.keys(exportComments[0]).slice(3).join(delimiter) + '\r\n';
    exportComments.forEach(element => {
      element.body = '"' + element.body.replace(/[\r\n]/g, ' ').replace(/ +/g, ' ').replace(/"/g, '""') + '"';
      valueFields += Object.values(element).slice(3).join(delimiter) + '\r\n';
    });
    csv = keyFields + valueFields;
    const myBlob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    const fileName = 'comments_' + date + '.csv';
    link.setAttribute('download', fileName);
    link.href = window.URL.createObjectURL(myBlob);
    link.click();
  }

  onExport(exportType: string): void {
    const date = new Date();
    const dateString = date.getFullYear() + '_' + ('0' + (date.getMonth() + 1)).slice(-2) + '_' + ('0' + date.getDate()).slice(-2);
    const timeString = ('0' + date.getHours()).slice(-2) + ('0' + date.getMinutes()).slice(-2) + ('0' + date.getSeconds()).slice(-2);
    const timestamp = dateString + '_' + timeString;
    if (exportType === 'comma') {
      this.exportCsv(',', timestamp);
    }
    if (exportType === 'semicolon') {
      this.exportCsv(';', timestamp);
    }
  }

  openExportDialog(): void {
    const dialogRef = this.dialog.open(CommentExportComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe(result => {
      this.onExport(result);
    });
  }
}
