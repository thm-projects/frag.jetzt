import { Component, OnInit } from '@angular/core';
import { RoomCreateComponent } from '../../creator/_dialogs/room-create/room-create.component';
import { MatDialog } from '@angular/material';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { User } from '../../../models/user';
import { UserRole } from '../../../models/user-roles.enum';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-landing',
  templateUrl: './new-landing.component.html',
  styleUrls: ['./new-landing.component.scss']
})
export class NewLandingComponent implements OnInit {

  user: User;
  demoId = 88992370;

  constructor(public authenticationService: AuthenticationService,
              private router: Router,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);
  }

  openCreateRoomDialog(): void {
    this.dialog.open(RoomCreateComponent, {
      width: '350px'
    });
  }

  joinDemo() {
    this.joinRoom(this.demoId);
  }

  joinRoom(id: number) {
    if (!this.user) {
      this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(loggedIn => {
        if (loggedIn === 'true') {
          this.router.navigate([`/participant/room/${id}`]);
        }
      });
    } else {
      this.router.navigate([`/participant/room/${id}`]);
    }
  }
}
