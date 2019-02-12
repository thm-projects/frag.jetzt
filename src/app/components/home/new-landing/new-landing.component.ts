import { Component, OnInit } from '@angular/core';
import { RoomCreateComponent } from '../../creator/_dialogs/room-create/room-create.component';
import { MatDialog } from '@angular/material';
import { RoomService } from '../../../services/http/room.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Room } from '../../../models/room';

export class Session {
  name: string;
  id: number;

  constructor(name: string, id: number) {
    this.id = id;
    this.name = name;
  }
}

@Component({
  selector: 'app-new-landing',
  templateUrl: './new-landing.component.html',
  styleUrls: ['./new-landing.component.scss']
})
export class NewLandingComponent implements OnInit {

  sessions: Session[] = new Array<Session>();

  constructor(public dialog: MatDialog) {
  }

  ngOnInit() {
    this.sessions[0] = new Session('Angular', 98299243);
    this.sessions[1] = new Session('Typescript', 52009627);
    this.sessions[2] = new Session('Angular', 48590407);
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreateComponent, {
      width: '350px'
    });
  }
}
