import { Component, OnInit } from '@angular/core';
import { Room } from '../room';
import { RoomService } from '../room.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {

  room: Room = null;

  constructor(private roomService: RoomService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.getRoom();
  }

  getRoom(): void {
    const roomId: string = this.route.snapshot.paramMap.get('roomId');
    this.roomService.getRoom(roomId).subscribe(room => this.room = room);
  }
}
