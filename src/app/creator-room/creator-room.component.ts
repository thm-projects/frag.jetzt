import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-creator-room',
  templateUrl: './creator-room.component.html',
  styleUrls: ['./creator-room.component.scss']
})
export class CreatorRoomComponent implements OnInit {
  room = '1';
  constructor() { }

  ngOnInit() {
  }

}
