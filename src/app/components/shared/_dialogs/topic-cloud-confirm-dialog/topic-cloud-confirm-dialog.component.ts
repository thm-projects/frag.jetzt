import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-topic-cloud-confirm-dialog',
  templateUrl: './topic-cloud-confirm-dialog.component.html',
  styleUrls: ['./topic-cloud-confirm-dialog.component.scss']
})
export class TopicCloudConfirmDialogComponent implements OnInit {

  constructor(
    public confirmDialogRef: MatDialogRef<TopicCloudConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  ngOnInit(): void {
  }

  onNoClick(): void {
    this.confirmDialogRef.close();
  }

}

export interface DialogData {
  topic: string;
}
