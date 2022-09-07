import { Component, OnInit } from '@angular/core';
import { RoomCreateComponent } from '../../shared/_dialogs/room-create/room-create.component';
import { MatDialog } from '@angular/material/dialog';
import { SessionService } from '../../../services/util/session.service';

@Component({
  selector: 'app-new-landing',
  templateUrl: './new-landing.component.html',
  styleUrls: ['./new-landing.component.scss']
})
export class NewLandingComponent implements OnInit {

  constructor(
    public dialog: MatDialog,
    public sessionService: SessionService,
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
