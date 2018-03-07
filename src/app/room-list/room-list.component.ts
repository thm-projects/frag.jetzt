import { Component, OnInit } from '@angular/core';
import { Room } from '../room';
import { RoomService} from '../room.service';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss']
})
export class RoomListComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
