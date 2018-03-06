import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-room-creation',
  templateUrl: './room-creation.component.html',
  styleUrls: ['./room-creation.component.scss']
})
export class RoomCreationComponent implements OnInit {
  longName: string;
  shortName: string;
  constructor() { }

  ngOnInit() {
  }

}
