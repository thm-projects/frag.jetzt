import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RoomCreateComponent } from '../../../shared/_dialogs/room-create/room-create.component';
import { Room } from '../../../../models/room';

@Component({
  selector: 'app-room-delete',
  templateUrl: './room-delete.component.html',
  styleUrls: ['./room-delete.component.scss']
})
export class RoomDeleteComponent implements OnInit {
  room: Room;

  constructor(              public dialogRef: MatDialogRef<RoomCreateComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
  }
}
