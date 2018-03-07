import { Component, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { Room } from '../room';

@Component({
  selector: 'app-room-creation',
  templateUrl: './room-creation.component.html',
  styleUrls: ['./room-creation.component.scss']
})
export class RoomCreationComponent implements OnInit {
  longName: string;
  shortName: string;

  constructor(private roomService: RoomService) {
  }

  ngOnInit() {
  }

  addRoom(longRoomName: string, shortRoomName: string) {
    longRoomName = longRoomName.trim();
    shortRoomName = shortRoomName.trim();
    if (!longRoomName || !shortRoomName) {
      return;
    }
    this.roomService.addRoom({ name: longRoomName, abbreviation: shortRoomName } as Room).subscribe();
  }
}

