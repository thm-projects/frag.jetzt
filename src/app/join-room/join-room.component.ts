import { Component, OnInit } from '@angular/core';
import { Room } from '../room';
import { RoomService } from '../room.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-join-room',
  templateUrl: './join-room.component.html',
  styleUrls: ['./join-room.component.scss']
})
export class JoinRoomComponent implements OnInit {

  room: Room;
  isExisting = true;
  noInput = false;

  constructor(private roomService: RoomService,
              private router: Router
              ) {
  }

  ngOnInit() {

  }

  joinRoom(id: string): void {
    if (id) {
        this.roomService.getRoom(id)
          .subscribe( room => {
            this.room = room;
            if (!room) {
              this.isExisting = false;
              this.noInput = false;
            } else {
              this.router.navigate([`/participant/room/${this.room.id}`]);
            }
          });
    } else {
      this.noInput = true;
      this.isExisting = true;
    }
  }

  reset(): void {
    this.isExisting = true;
    this.noInput = false;
  }
}
