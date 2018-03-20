import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { RoomCreationComponent } from '../../dialogs/room-creation/room-creation.component';

@Component({
  selector: 'app-creator-home-screen',
  templateUrl: './creator-home-screen.component.html',
  styleUrls: ['./creator-home-screen.component.scss']
})
export class CreatorHomeScreenComponent implements OnInit {
  constructor(public dialog: MatDialog) {
  }

  ngOnInit() {
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreationComponent, {
      width: '350px'
    });
  }
}
