import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { RoomEditComponent } from '../room-edit/room-edit.component';

@Component({
  selector: 'app-comment-export',
  templateUrl: './comment-export.component.html',
  styleUrls: ['./comment-export.component.scss']
})
export class CommentExportComponent implements OnInit {

  exportType = 'comma';

  constructor(public dialogRef: MatDialogRef<RoomEditComponent>) { }

  ngOnInit() {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}

