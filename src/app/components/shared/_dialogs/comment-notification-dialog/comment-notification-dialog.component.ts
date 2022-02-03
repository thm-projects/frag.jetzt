import { Component, Input, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-comment-notification-dialog',
  templateUrl: './comment-notification-dialog.component.html',
  styleUrls: ['./comment-notification-dialog.component.scss']
})
export class CommentNotificationDialogComponent implements OnInit {

  @Input() room: Room;
  date = new Date();

  constructor(
    private dialogRef: MatDialogRef<CommentNotificationDialogComponent>
  ) {
  }

  ngOnInit(): void {
  }

  onClose(): void {
    this.dialogRef.close();
  }

}
