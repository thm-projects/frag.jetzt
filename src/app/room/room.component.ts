import { Component, OnInit } from '@angular/core';
import { Room } from '../room';
import { RoomService } from '../room.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Location } from '@angular/common';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {
  room: Room = null;
  isLoading = true;

  constructor(protected roomService: RoomService,
              protected route: ActivatedRoute,
              protected location: Location) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }

  getRoom(id: string): void {
    this.roomService.getRoom(id).subscribe(room => {
      this.room = room;
      this.isLoading = false;
    });
  }

  delete(room: Room): void {
    this.roomService.deleteRoom(room).subscribe();
    this.location.back();
  }
}
