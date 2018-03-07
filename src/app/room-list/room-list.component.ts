import { Component, OnInit } from '@angular/core';
import { Room } from '../room';
import { RoomService } from '../room.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss']
})
export class RoomListComponent implements OnInit {

  rooms: Room[];

  closedRooms: Room[];

  constructor(
    private roomService: RoomService
  ) {
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
