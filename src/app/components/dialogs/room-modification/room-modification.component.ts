import { Component, Inject, OnInit } from '@angular/core';
import { Room } from '../../../room';
import { RoomService } from '../../../room.service';
import { RoomCreationComponent } from '../room-creation/room-creation.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { NotificationService } from '../../../notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-room-modification',
  templateUrl: './room-modification.component.html',
  styleUrls: ['./room-modification.component.scss']
})
export class RoomModificationComponent implements OnInit {
  editRoom: Room;

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
