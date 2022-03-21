import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ProfanityFilter, Room } from '../../../../models/room';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RoomDeleteComponent } from '../room-delete/room-delete.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../../../services/http/authentication.service';
import { RoomDeleted } from '../../../../models/events/room-deleted';
import { EventService } from '../../../../services/util/event.service';


@Component({
  selector: 'app-room-edit',
  templateUrl: './room-edit.component.html',
  styleUrls: ['./room-edit.component.scss']
})
export class RoomEditComponent implements OnInit {
  editRoom: Room;
  check = false;
  profanityCheck: boolean;
  censorPartialWordsCheck: boolean;
  censorLanguageSpecificCheck: boolean;

  roomNameFormControl = new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]);

  constructor(public dialogRef: MatDialogRef<RoomEditComponent>,
              public dialog: MatDialog,
              public notificationService: NotificationService,
              public translationService: TranslateService,
              protected roomService: RoomService,
              private authenticationService: AuthenticationService,
              public router: Router,
              public eventService: EventService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
    this.check = this.editRoom.questionsBlocked;
    this.profanityCheck = this.editRoom.profanityFilter !== ProfanityFilter.DEACTIVATED;
    if (this.editRoom.profanityFilter === ProfanityFilter.ALL){
      this.censorLanguageSpecificCheck = this.censorPartialWordsCheck = true;
    } else if (this.profanityCheck){
      this.censorLanguageSpecificCheck = this.editRoom.profanityFilter === ProfanityFilter.LANGUAGE_SPECIFIC;
      this.censorPartialWordsCheck = this.editRoom.profanityFilter === ProfanityFilter.PARTIAL_WORDS;
    }
  }

  openDeleteRoomDialog(): void {
    const dialogRef = this.dialog.open(RoomDeleteComponent, {
      width: '400px'
    });
    dialogRef.componentInstance.room = this.editRoom;
    dialogRef.afterClosed()
      .subscribe(result => {
        if (result === 'delete') {
          this.deleteRoom(this.editRoom);
        }
      });
  }

  deleteRoom(room: Room): void {
    this.translationService.get('room-page.deleted').subscribe(msg => {
      this.notificationService.show(room.name + msg);
    });
    this.roomService.deleteRoom(room.id).subscribe(result => {
      const event = new RoomDeleted(room.id);
      this.eventService.broadcast(event.type, event.payload);
      this.authenticationService.removeAccess(room.shortId);
      this.closeDialog('delete');
      this.router.navigate([`/user`]);
    });
  }

  /**
   * Closes the dialog on call.
   */
  closeDialog(type: string): void {
    this.dialogRef.close(type);
  }

  save(): void {
    this.editRoom.questionsBlocked = this.check;
    this.editRoom.profanityFilter = this.profanityCheck ? ProfanityFilter.NONE : ProfanityFilter.DEACTIVATED;
    if (this.profanityCheck) {
      if (this.censorLanguageSpecificCheck && this.censorPartialWordsCheck) {
        this.editRoom.profanityFilter = ProfanityFilter.ALL;
      } else {
        this.editRoom.profanityFilter = this.censorLanguageSpecificCheck ? ProfanityFilter.LANGUAGE_SPECIFIC : ProfanityFilter.NONE;
        this.editRoom.profanityFilter = this.censorPartialWordsCheck ? ProfanityFilter.PARTIAL_WORDS : this.editRoom.profanityFilter;
      }
    }
    this.roomService.updateRoom(this.editRoom).subscribe(r => this.editRoom = r);
    if (!this.roomNameFormControl.hasError('required')
        && !this.roomNameFormControl.hasError('minlength')
        && !this.roomNameFormControl.hasError('maxlength')) {
      this.closeDialog('update');
    }
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog('abort');
  }

  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildSaveActionCallback(): () => void {
    return () => this.save();
  }

  showMessage(label: string, event: boolean) {
    if (event) {
      this.translationService.get('room-page.'+label).subscribe(msg => {
        this.notificationService.show(msg);
      });
    }
  }
}
