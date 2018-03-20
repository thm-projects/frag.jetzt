import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { RoomCreationComponent } from '../../dialogs/room-create/room-create.component';

@Component({
  selector: 'app-creator-home-screen',
  templateUrl: './home-creator.component.html',
  styleUrls: ['./home-creator.component.scss']
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
