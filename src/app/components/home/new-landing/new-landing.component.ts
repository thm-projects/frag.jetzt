import { Component, OnInit } from '@angular/core';
import { RoomCreateComponent } from '../../creator/_dialogs/room-create/room-create.component';
import { MatDialog } from '@angular/material';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';

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
  user: User;

  constructor(public authenticationService: AuthenticationService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.sessions[0] = new Session('Angular', 98299243);
    this.sessions[1] = new Session('Typescript', 52009627);
    this.sessions[2] = new Session('Angular', 48590407);
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreateComponent, {
      width: '350px'
    });
  }

  login(): void {
    if (!this.user) {
      this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe();
    }
  }
}
