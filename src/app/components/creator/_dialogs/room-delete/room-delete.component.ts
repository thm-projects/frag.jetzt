import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Room } from '../../../../models/room';
import { RoomEditComponent } from '../room-edit/room-edit.component';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-room-delete',
  templateUrl: './room-delete.component.html',
  styleUrls: ['./room-delete.component.scss']
})
export class RoomDeleteComponent implements OnInit {
  room: Room;

  /**
   * The confirm button type of the dialog.
   */
  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;

  constructor(public dialogRef: MatDialogRef<RoomEditComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private liveAnnouncer: LiveAnnouncer,
              private translationService: TranslateService ) { }


  ngOnInit() {
    this.translationService.get('room-page.reallySession').subscribe(msg1 => {
      this.translationService.get('room-page.really2').subscribe(msg2 => {
        this.liveAnnouncer.announce(msg1 + this.room.name + msg2);
      });
    });
  }

  /**
   * Closes the dialog on call.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog();
  }

  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildRoomDeleteActionCallback(): () => void {
    return () => this.dialogRef.close('delete');
  }
}
