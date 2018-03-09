import { Component, OnInit } from '@angular/core';
import { Room } from '../room';
import { Location } from '@angular/common';
import { RoomService } from '../room.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-participant-room',
  templateUrl: './participant-room.component.html',
  styleUrls: ['./participant-room.component.scss']
})
export class ParticipantRoomComponent implements OnInit {

  room: Room;

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
      .subscribe(room => this.room = room);
  }


  goBack(): void {
    this.location.back();
  }
}
