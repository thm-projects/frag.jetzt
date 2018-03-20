import { Component, OnInit } from '@angular/core';
import { RoomService } from '../../../room.service';
import { ActivatedRoute } from '@angular/router';
import { RoomComponent } from '../room/room.component';
import { Room } from '../../../room';
import { Location } from '@angular/common';
import { NotificationService } from '../../../notification.service';
import { MatDialog } from '@angular/material';
import { ContentCreationComponent } from '../content-creation/content-creation.component';
import { RoomDeletionComponent } from '../../dialogs/room-deletion/room-deletion.component';
import { RoomModificationComponent } from '../../dialogs/room-modification/room-modification.component';

@Component({
  selector: 'app-creator-room',
  templateUrl: './creator-room.component.html',
  styleUrls: ['./creator-room.component.scss']
})
export class CreatorRoomComponent extends RoomComponent implements OnInit {
  room: Room;
  updRoom: Room;

  constructor(protected roomService: RoomService,
              protected notification: NotificationService,
              protected route: ActivatedRoute,
              protected location: Location,
              public dialog: MatDialog
            ) {
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

  updateRoom(): void {
    if ((this.updRoom.name === this.room.name) &&
      (this.updRoom.shortId === this.room.shortId) &&
      (this.updRoom.description === this.room.description)
    ) {
      this.notification.show('There were no changes');
      return;
    } else {
      this.notification.show('Changes are made');
      this.room.name = this.updRoom.name;
      this.room.shortId = this.updRoom.shortId;
      this.room.description = this.updRoom.description;
      this.roomService.updateRoom(this.room)
        .subscribe();
    }
  }

  deleteRoom(room: Room): void {
    const msg = room.name + ' deleted';
    this.notification.show(msg);
    this.delete(room);
  }

  createContentDialog(): void {
    const dialogRef = this.dialog.open(ContentCreationComponent, {
      width: '350px'
    });
    dialogRef.componentInstance.roomId = this.room.id;
  }

  confirmDeletion(dialogAnswer: string): void {
    if (dialogAnswer === 'delete') {
      this.deleteRoom(this.room);
    }
  }

  openDeletionRoomDialog(): void {
    const dialogRef = this.dialog.open(RoomDeletionComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.room = this.room;
    dialogRef.afterClosed()
      .subscribe(result => {
        this.confirmDeletion(result);
      });
  }

  showEditDialog(): void {
    this.updRoom = new Room();
    this.updRoom.name = this.room.name;
    this.updRoom.shortId = this.room.shortId;
    this.updRoom.description = this.room.description;
    const dialogRef = this.dialog.open(RoomModificationComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.editRoom = this.updRoom;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'abort') {
          return;
        }
        if (result === 'edit') {
          this.updateRoom();
        }
      });
  }
}

