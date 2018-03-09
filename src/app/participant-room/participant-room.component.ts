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

  roomId = '12 34 56 78';
  roomName = 'Test Room';
  roomDescription = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore ' +
    'magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea ' +
    'takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod ' +
    'tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea ' +
    'rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.';

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
