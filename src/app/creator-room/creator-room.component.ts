import { Component, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { ActivatedRoute } from '@angular/router';
import { RoomComponent } from '../room/room.component';
import { Room } from '../room';
import { Location } from '@angular/common';

@Component({
  selector: 'app-creator-room',
  templateUrl: './creator-room.component.html',
  styleUrls: ['./creator-room.component.scss']
})
export class CreatorRoomComponent extends RoomComponent implements OnInit {
  room: Room;
  constructor(protected roomService: RoomService,
              protected route: ActivatedRoute,
              private location: Location) {
    super(roomService, route);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }
  goBack(): void {
    this.location.back();
  }

}
