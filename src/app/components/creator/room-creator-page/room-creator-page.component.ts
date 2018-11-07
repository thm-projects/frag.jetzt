import { Component, OnInit } from '@angular/core';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute } from '@angular/router';
import { RoomPageComponent } from '../../shared/room-page/room-page.component';
import { Room } from '../../../models/room';
import { Location } from '@angular/common';
import { NotificationService } from '../../../services/util/notification.service';
import { MatDialog } from '@angular/material';
import { RoomDeleteComponent } from '../_dialogs/room-delete/room-delete.component';
import { RoomEditComponent } from '../_dialogs/room-edit/room-edit.component';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/util/language.service';

@Component({
  selector: 'app-room-creator-page',
  templateUrl: './room-creator-page.component.html',
  styleUrls: ['./room-creator-page.component.scss']
})
export class RoomCreatorPageComponent extends RoomPageComponent implements OnInit {
  room: Room;
  updRoom: Room;

  constructor(protected roomService: RoomService,
              protected notification: NotificationService,
              protected route: ActivatedRoute,
              protected location: Location,
              public dialog: MatDialog,
              private translateService: TranslateService,
              protected langService: LanguageService) {
    super(roomService, route, location);
    langService.langEmitter.subscribe(lang => translateService.use(lang));
  }

  ngOnInit() {
    this.translateService.use(sessionStorage.getItem('currentLang'));
    this.route.params.subscribe(params => {
      this.getRoom(params['roomId']);
      console.log(this.room.name);
    });
  }

  updateRoom(): void {
    if ((this.updRoom.name === this.room.name) &&
      (this.updRoom.description === this.room.description)
    ) {
      this.notification.show('There were no changes');
      return;
    } else {
      this.room.name = this.updRoom.name;
      this.room.description = this.updRoom.description;
      this.roomService.updateRoom(this.room)
        .subscribe(() => {
          this.notification.show('Changes are made');
        });
    }
  }

  deleteRoom(room: Room): void {
    const msg = room.name + ' deleted';
    this.notification.show(msg);
    this.delete(room);
  }

  confirmDeletion(dialogAnswer: string): void {
    if (dialogAnswer === 'delete') {
      this.deleteRoom(this.room);
    }
  }

  openDeletionRoomDialog(): void {
    const dialogRef = this.dialog.open(RoomDeleteComponent, {
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
    const dialogRef = this.dialog.open(RoomEditComponent, {
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

