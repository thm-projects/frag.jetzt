import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Room } from '../../../../models/room';
import { RoomEditComponent } from '../room-edit/room-edit.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';


@Component({
  selector: 'app-room-delete',
  templateUrl: './room-delete.component.html',
  styleUrls: ['./room-delete.component.scss']
})
export class RoomDeleteComponent implements OnInit {
  room: Room;

  constructor(public dialogRef: MatDialogRef<RoomEditComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private liveAnnouncer: LiveAnnouncer) { }


  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.announce();
  }
  public announce() {
    this.liveAnnouncer.announce('Willst du die Session wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.', 'assertive');

  }
}
