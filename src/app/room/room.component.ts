import { Component, OnInit } from '@angular/core';
import { Room } from '../room';
import { RoomService } from '../room.service';


@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {

  rooms: Room[];

  constructor(private roomService: RoomService) {
  }

  ngOnInit() {
    this.getRooms();
  }

  getRooms(): void {
    this.roomService.getRooms().subscribe(rooms => this.rooms = rooms);
  }

  add(name: string): void {
    name = name.trim();
    if (!name) {
      return;
    }
    this.roomService.addRoom({name} as Room).subscribe(room => {
      this.rooms.push(room);
    });
  }

}
