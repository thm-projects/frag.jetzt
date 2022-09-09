import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RoomCreateComponent } from '../../shared/_dialogs/room-create/room-create.component';

@Component({
  selector: 'app-home-creator-page',
  templateUrl: './home-creator-page.component.html',
  styleUrls: ['./home-creator-page.component.scss']
})

export class HomeCreatorPageComponent implements OnInit {
  constructor(
    public dialog: MatDialog,
  ) {
  }

  ngOnInit() {
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreateComponent, {
      width: '350px'
    });
  }
}
