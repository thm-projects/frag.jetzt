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
  buildExportActionCallback(): () => void {
    return () => this.dialogRef.close(this.exportType);
  }
}
