import { Component, Inject, OnInit } from '@angular/core';
import { Room } from '../../../../models/room';
import { RoomCreateComponent } from '../../../shared/_dialogs/room-create/room-create.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { TSMap } from 'typescript-map';

@Component({
  selector: 'app-room-edit',
  templateUrl: './room-edit.component.html',
  styleUrls: ['./room-edit.component.scss']
})
export class RoomEditComponent implements OnInit {
  editRoom: Room;
  commentThreshold: number;

  constructor(public dialogRef: MatDialogRef<RoomCreateComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    // ToDo: implement a more robust way
    // ToDo: have a default comment threshold defined in config files
    if (this.editRoom.extensions != null) {
      const commentExtension = this.editRoom.extensions.get('comments');
      if ((commentExtension != null) && commentExtension.get('threshold') != null) {
        this.commentThreshold = commentExtension.get('threshold');
      } else {
        this.commentThreshold = -10;
      }
    } else {
      this.commentThreshold = -10;
    }
  }

  onSliderChange(event: any) {
    this.commentThreshold = event.value;
  }
}
