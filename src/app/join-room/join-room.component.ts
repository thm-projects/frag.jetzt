import { Component, OnInit } from '@angular/core';
import { Room } from '../room';
import { RoomService } from '../room.service';
import { Router } from '@angular/router';
import { RegisterErrorStateMatcher } from '../register/register.component';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material';
import { NotificationService } from '../notification.service';

export class JoinErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return (control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-join-room',
  templateUrl: './join-room.component.html',
  styleUrls: ['./join-room.component.scss']
})
export class JoinRoomComponent implements OnInit {

  room: Room;
  isExisting = true;

  roomFormControl = new FormControl('', [Validators.required]);

  matcher = new RegisterErrorStateMatcher();

  constructor(private roomService: RoomService,
              private router: Router,
              public notificationService: NotificationService
  ) {
  }

  ngOnInit() {
  }

  joinRoom(id: string): void {
    if (!this.roomFormControl.hasError('required')) {
      this.roomService.getRoom(id)
        .subscribe(room => {
          this.room = room;
          if (!room) {
            this.notificationService.show(`No room was found with id: ${id}`);
          } else {
            this.router.navigate([`/participant/room/${this.room.id}`]);
          }
        });
    }
  }

}
