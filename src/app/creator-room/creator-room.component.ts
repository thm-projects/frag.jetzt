import { Component, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { ActivatedRoute } from '@angular/router';
import { RoomComponent } from '../room/room.component';
import { Room } from '../room';

@Component({
  selector: 'app-creator-room',
  templateUrl: './creator-room.component.html',
  styleUrls: ['./creator-room.component.scss']
})
export class CreatorRoomComponent extends RoomComponent implements OnInit {
  room: Room;
  constructor(protected roomService: RoomService,
              protected route: ActivatedRoute) {
    super(roomService, route);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }

}
