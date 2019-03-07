import { Component, OnInit } from '@angular/core';
import { Room } from '../../../models/room';
import { RoomService } from '../../../services/http/room.service';
import { Router } from '@angular/router';
import { RegisterErrorStateMatcher } from '../../home/_dialogs/register/register.component';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';
import { NotificationService } from '../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from '../../../services/http/authentication.service';
import { UserRole } from '../../../models/user-roles.enum';
import { User } from '../../../models/user';
import { log } from 'util';

export class JoinErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return (control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-room-join',
  templateUrl: './room-join.component.html',
  styleUrls: ['./room-join.component.scss']
})
export class RoomJoinComponent implements OnInit {

  room: Room;
  demoId = '95680586';
  user: User;

  roomFormControl = new FormControl('', [Validators.required, Validators.pattern('[0-9 ]*')]);

  matcher = new RegisterErrorStateMatcher();

  constructor(private roomService: RoomService,
              private router: Router,
              public notificationService: NotificationService,
              private translateService: TranslateService,
              public authenticationService: AuthenticationService) {
  }

  ngOnInit() {
    this.authenticationService.watchUser.subscribe(newUser => this.user = newUser);
  }

  getRoom(id: string): void {
    if (id.length - (id.split(' ').length - 1) < 8) {
      this.translateService.get('home-page.exactly-8').subscribe(message => {
        this.notificationService.show(message);
      });
    } else if (this.roomFormControl.hasError('pattern')) {
      this.translateService.get('home-page.only-numbers').subscribe(message => {
        this.notificationService.show(message);
      });
    } else {
      this.roomService.getRoomByShortId(id.replace(/\s/g, ''))
      .subscribe(room => {
        this.room = room;
        if (!room) {
          this.translateService.get('home-page.no-room-found').subscribe(message => {
            this.notificationService.show(message);
          });
        } else {
          if (!this.user) {
            this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(loggedIn => {
              if (loggedIn === 'true') {
                this.addAndNavigate();
              }
            });
          } else {
            this.addAndNavigate();
          }
        }
      });
    }
  }

  joinRoom(id: string): void {
    if (!this.roomFormControl.hasError('required') && !this.roomFormControl.hasError('minlength')) {
      this.getRoom(id);
    }
  }

  addAndNavigate() {
    this.roomService.addToHistory(this.room.id);
    this.router.navigate([`/participant/room/${this.room.shortId}`]);
  }

  joinDemo(): void {
    this.getRoom(this.demoId);
  }
}
