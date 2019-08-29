import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RoomEditComponent } from '../../../creator/_dialogs/room-edit/room-edit.component';
import { RoomService } from '../../../../services/http/room.service';
import { Room } from '../../../../models/room';

@Component({
  selector: 'app-delete-account',
  templateUrl: './delete-account.component.html',
  styleUrls: ['./delete-account.component.scss']
})
export class DeleteAccountComponent implements OnInit {

  rooms: Room[];

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

  sortRooms() {
    const roomList = this.rooms.sort((a, b) => {
      return a.name > b.name ? 1 : -1;
    });
    this.rooms = roomList;
  }
}
