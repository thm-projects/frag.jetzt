import { Component, OnInit } from '@angular/core';
import { Room } from '../room';
import { RoomService } from '../room.service';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss']
})
export class RoomListComponent implements OnInit {
  rooms: Room[];
  closedRooms: Room[];

  constructor(protected roomService: RoomService) {
  }

  ngOnInit() {
    this.getRooms();
  }

  getRooms(): void {
    this.roomService.getRooms().subscribe(rooms => {
      this.rooms = rooms;
      this.closedRooms = this.rooms.filter(room => room.closed);
    });
  }
}
