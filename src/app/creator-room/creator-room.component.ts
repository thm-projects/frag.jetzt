import { Component, OnInit } from '@angular/core';
import { RoomService } from '../room.service';
import { ActivatedRoute } from '@angular/router';
import { RoomComponent } from '../room/room.component';
import { Room } from '../room';
import { Location } from '@angular/common';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-creator-room',
  templateUrl: './creator-room.component.html',
  styleUrls: ['./creator-room.component.scss']
})
export class CreatorRoomComponent extends RoomComponent implements OnInit {
  room: Room;
  deleteDialog = false;

  constructor(protected roomService: RoomService,
              protected notification: NotificationService,
              protected route: ActivatedRoute,
              protected location: Location) {
    super(roomService, route, location);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
    });
  }

  goBack(): void {
    this.location.back();
  }

  enableDeletion(): void {
    this.deleteDialog = true;
  }

  disableDeletion(): void {
    this.deleteDialog = false;
  }

  deleteRoom(room: Room): void {
    const msg = room.name + ' deleted';
    this.notification.show(msg);
    this.delete(room);
  }

}
