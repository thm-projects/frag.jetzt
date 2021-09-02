import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogConfirmActionButtonType } from '../../dialog/dialog-action-buttons/dialog-action-buttons.component';

@Component({
  selector: 'app-topic-cloud-confirm-dialog',
  templateUrl: './topic-cloud-confirm-dialog.component.html',
  styleUrls: ['./topic-cloud-confirm-dialog.component.scss']
})
export class TopicCloudConfirmDialogComponent implements OnInit {

  confirmButtonType: DialogConfirmActionButtonType = DialogConfirmActionButtonType.Alert;
  confirmLabel = this.data.confirmLabel;
  constructor(
    public confirmDialogRef: MatDialogRef<TopicCloudConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.confirmDialogRef.close();
  }

  close(type: string): void {
    this.confirmDialogRef.close(type);
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
    return () => this.close(this.data.confirmLabel);
  }
}

export interface DialogData {
  topic: string;
  message: string;
  confirmLabel: string;
}
