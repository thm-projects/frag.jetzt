import { Component, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { DialogConfirmActionButtonType } from '../../../shared/dialog/dialog-action-buttons/dialog-action-buttons.component';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
})
export class OverlayComponent implements OnInit {
  confirmButtonType: DialogConfirmActionButtonType;

  constructor(private dialogRef: MatDialogRef<OverlayComponent>) {
    this.confirmButtonType = DialogConfirmActionButtonType.Primary;
  }

  ngOnInit() {}

  onResume() {
    this.dialogRef.close(true);
  }

  onAbort() {
    this.dialogRef.close(false);
  }
}
