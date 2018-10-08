import { Component, Inject, OnInit } from '@angular/core';
import { RoomService } from '../../../services/http/room.service';
import { Room } from '../../../models/room';
import { Router } from '@angular/router';
import { NotificationService } from '../../../services/util/notification.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { ContentService} from "../../../services/http/content.service";

@Component({
  selector: 'app-room-create',
  templateUrl: './room-create.component.html',
  styleUrls: ['./room-create.component.scss']
})
export class RoomCreateComponent implements OnInit {
  longName: string;
  shortName: string;
  emptyInputs = false;
  room: Room;
  roomId: string;

  constructor(private roomService: RoomService,
              private contentService: ContentService,
              private router: Router,
              private notification: NotificationService,
              public dialogRef: MatDialogRef<RoomCreateComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
  }

  resetEmptyInputs(): void {
    this.emptyInputs = false;
  }

  addRoom(longRoomName: string, description: string) {
    longRoomName = longRoomName.trim();
    if (!longRoomName) {
      this.emptyInputs = true;
      return;
    }
    this.roomService.addRoom({
      name: longRoomName,
      abbreviation: '00000000',
      description: description
    } as Room).subscribe(room => {
      this.room = room;
      this.notification.show(`Room '${this.room.name}' successfully created.`);
      this.router.navigate([`/creator/room/${this.room.shortId}`]);
      this.dialogRef.close();
    });
  }
}
