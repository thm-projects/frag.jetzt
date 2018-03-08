import { Component, Inject, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { Room } from '../room';
import { Router } from '@angular/router';
import { NotificationService } from '../notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RegisterComponent } from '../register/register.component';

@Component({
  selector: 'app-room-creation',
  templateUrl: './room-creation.component.html',
  styleUrls: ['./room-creation.component.scss']
})
export class RoomCreationComponent implements OnInit {
  longName: string;
  shortName: string;

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

  addRoom(longRoomName: string, shortRoomName: string) {
    longRoomName = longRoomName.trim();
    shortRoomName = shortRoomName.trim();
    if (!longRoomName || !shortRoomName) {
      return;
    }
    this.roomService.addRoom({ name: longRoomName, abbreviation: shortRoomName } as Room)
      .subscribe(room => {
        this.notification.show(`room '${room.name}' successfully created.`);
        this.router.navigate([`room/${room.id}`]);
        this.dialogRef.close();
      });
  }
}

