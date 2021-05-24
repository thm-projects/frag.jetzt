import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Room } from '../../../../models/room';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { RoomDeleteComponent } from '../room-delete/room-delete.component';
import { NotificationService } from '../../../../services/util/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { RoomService } from '../../../../services/http/room.service';
import { Router } from '@angular/router';
import { RoomCreatorPageComponent } from '../../room-creator-page/room-creator-page.component';
import { EventService } from '../../../../services/util/event.service';
import { RoomDeleted } from '../../../../models/events/room-deleted';


@Component({
  selector: 'app-room-edit',
  templateUrl: './room-edit.component.html',
  styleUrls: ['./room-edit.component.scss']
})
export class RoomEditComponent implements OnInit {
  editRoom: Room;
  check: boolean = false;

  roomNameFormControl = new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]);

  constructor(public dialogRef: MatDialogRef<RoomCreatorPageComponent>,
              public dialog: MatDialog,
              public notificationService: NotificationService,
              public translationService: TranslateService,
              protected roomService: RoomService,
              public router: Router,
              public eventService: EventService,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit() {
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
    this.editRoom.closed = this.check;
    console.log(this.check);
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
  public blockedQuestions() {
    var checkBox = <HTMLInputElement> document.getElementById("myCheck");
    var save = document.getElementById("save");
    if(checkBox.checked){
      console.log(checkBox.checked);
      // flip state if clicked
      this.editRoom.closed = !this.editRoom.closed;
      this.roomService.updateRoom(this.editRoom).subscribe(r => this.editRoom = r);
    }
    console.log(checkBox.checked);
    
  }
  
}
