import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-topic-cloud-confirm-dialog',
  templateUrl: './topic-cloud-confirm-dialog.component.html',
  styleUrls: ['./topic-cloud-confirm-dialog.component.scss'],
})
export class TopicCloudConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}
}

export interface DialogData {
  topic: string;
  message: string;
  confirmLabel: string;
}
