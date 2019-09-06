import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { RoomEditComponent } from '../room-edit/room-edit.component';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-delete-comment',
  templateUrl: './delete-comments.component.html',
  styleUrls: ['./delete-comments.component.scss']
})
export class DeleteCommentsComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<RoomEditComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private liveAnnouncer: LiveAnnouncer)  { }


  ngOnInit() {
    this.announce();
  }
  public announce() {
    this.liveAnnouncer.announce('Willst du wirklich alle Fragen dieser Session löschen?', 'assertive');
  }

  close(type: string): void {
    this.dialogRef.close(type);
  }

}
