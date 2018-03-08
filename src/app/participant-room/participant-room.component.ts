import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-participant-room',
  templateUrl: './participant-room.component.html',
  styleUrls: ['./participant-room.component.scss']
})
export class ParticipantRoomComponent implements OnInit {

  roomId = '12 34 56 78';
  roomName = 'Test Room';
  roomDescription = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore ' +
    'magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea ' +
    'takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod ' +
    'tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea ' +
    'rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.';

  constructor() {
  }

  ngOnInit() {
  }

}
