import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogConfirmActionButtonType } from '../../dialog/dialog-action-buttons/dialog-action-buttons.component';
import { UserRole } from '../../../../models/user-roles.enum';

@Component({
  selector: 'app-remove-from-history',
  templateUrl: './remove-from-history.component.html',
  styleUrls: ['./remove-from-history.component.scss']
})
export class RemoveFromHistoryComponent implements OnInit {

  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;

  roomName: string;
  role: UserRole;

  constructor(
    public dialogRef: MatDialogRef<RemoveFromHistoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  ngOnInit() {
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
    return () => this.close('remove');
  }

}
