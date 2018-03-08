import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { RoomCreationComponent } from '../room-creation/room-creation.component';
import { RoomListComponent } from '../room-list/room-list.component';
import { RoomService } from '../room.service';

@Component({
  selector: 'app-creator-home-screen',
  templateUrl: './creator-home-screen.component.html',
  styleUrls: ['./creator-home-screen.component.scss']
})
export class CreatorHomeScreenComponent extends RoomListComponent implements OnInit {

  constructor(public dialog: MatDialog,
              protected roomService: RoomService) {
    super(roomService);
  }

  ngOnInit() {
    this.getRooms();
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreationComponent, {
      width: '350px'
    });
  }
}
