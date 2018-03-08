import { Component, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { Room } from '../room';
import { Router } from '@angular/router';
import { NotificationService } from '../notification.service';

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
              private notification: NotificationService) {
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
      });
  }
}

