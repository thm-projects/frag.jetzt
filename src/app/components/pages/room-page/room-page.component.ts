import { Component, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-room-page',
  templateUrl: './room-page.component.html',
  styleUrls: ['./room-page.component.scss']
})
export class RoomPageComponent implements OnInit {
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
    this.roomService.deleteRoom(room.id).subscribe();
    this.location.back();
  }
}
