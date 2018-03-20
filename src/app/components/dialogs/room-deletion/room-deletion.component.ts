import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { NotificationService } from '../../../notification.service';
import { RoomCreationComponent } from '../room-creation/room-creation.component';
import { RoomService } from '../../../room.service';
import { Room } from '../../../models/room';

@Component({
  selector: 'app-room-deletion',
  templateUrl: './room-deletion.component.html',
  styleUrls: ['./room-deletion.component.scss']
})
export class RoomDeletionComponent implements OnInit {
  room: Room;

  constructor(private roomService: RoomService,
              private router: Router,
              private notification: NotificationService,
              public dialogRef: MatDialogRef<RoomCreationComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
  }
}
