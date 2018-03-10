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
  modify = false;
  deleteDialog = false;
  roomName: string;
  roomShortId: string;
  roomDescription: string;

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

  enableModifications(): void {
    this.roomName = this.room.name;
    this.roomShortId = this.room.shortId;
    this.roomDescription = this.room.description;
    this.modify = true;
  }

  disableModifications(): void {
    this.modify = false;
  }

  updateRoom(): void {
    if ((this.roomName === this.room.name) &&
      (this.roomShortId === this.room.shortId) &&
      (this.roomDescription === this.room.description)
    ) {
      return;
    } else {
      this.roomService.updateRoom(this.room)
        .subscribe(() => this.goBack());
    }
  }
  showDeletionDialog(): void {
    this.deleteDialog = true;
  }

  hideDeletionDialog(): void {
    this.deleteDialog = false;
  }

  deleteRoom(room: Room): void {
    const msg = room.name + ' deleted';
    this.notification.show(msg);
    this.delete(room);
  }
}
