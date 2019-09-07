import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RoomEditComponent } from '../../../creator/_dialogs/room-edit/room-edit.component';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';
import { DialogConfirmActionButtonType } from '../../dialog/dialog-action-buttons/dialog-action-buttons.component';

@Component({
  selector: 'app-delete-account',
  templateUrl: './delete-account.component.html',
  styleUrls: ['./delete-account.component.scss']
})
export class DeleteAccountComponent implements OnInit {

  rooms: Room[];


  /**
   * The confirm button type of the delete account.
   */
  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;


  constructor(public dialogRef: MatDialogRef<RoomEditComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private roomService: RoomService) { }

  ngOnInit() {
    this.roomService.getCreatorRooms().subscribe(rooms => {
      this.rooms = rooms;
      this.sortRooms();
    });
  }

  close(type: string): void {
    this.dialogRef.close(type);
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.close('abort');
  }


  /**
   * Returns a lambda which executes the dialog dedicated action on call.
   */
  buildDeleteAccountActionCallback(): () => void {
    return () => this.close('delete');
  }


  sortRooms() {
    const roomList = this.rooms.sort((a, b) => {
      return a.name > b.name ? 1 : -1;
    });
    this.rooms = roomList;
  }
}
