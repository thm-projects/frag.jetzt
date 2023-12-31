import { Component } from '@angular/core';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
})
export class OverlayComponent {
  confirmButtonType: DialogConfirmActionButtonType;

  constructor(private dialogRef: MatDialogRef<OverlayComponent>) {
    this.confirmButtonType = DialogConfirmActionButtonType.Primary;
  }

  onResume() {
    this.dialogRef.close(true);
  }

  onAbort() {
    this.dialogRef.close(false);
  }
}
