import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-demo-video',
  templateUrl: './demo-video.component.html',
  styleUrls: ['./demo-video.component.scss']
})
export class DemoVideoComponent implements OnInit {

  deviceType: string;

  constructor(public dialogRef: MatDialogRef<DemoVideoComponent>,
              public dialog: MatDialog) { }

  ngOnInit() {
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
