import { Component, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { Location } from '@angular/common';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-room-participant-page',
  templateUrl: './room-participant-page.component.html',
  styleUrls: ['./room-participant-page.component.scss']
})
export class RoomParticipantPageComponent implements OnInit {

  room: Room;
  isLoading = true;

  constructor(private location: Location,
              private roomService: RoomService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }

  getRoom(id: string): void {
    this.roomService.getRoom(id)
      .subscribe(room => {
        this.room = room;
        this.isLoading = false;
      });
  }

  goBack(): void {
    this.location.back();
  }
}
