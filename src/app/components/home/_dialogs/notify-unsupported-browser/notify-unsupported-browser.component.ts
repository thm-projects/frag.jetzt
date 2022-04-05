import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-notify-unsupported-browser',
  templateUrl: './notify-unsupported-browser.component.html',
  styleUrls: ['./notify-unsupported-browser.component.scss']
})
export class NotifyUnsupportedBrowserComponent implements OnInit {

  constructor(
    private dialogRef: MatDialogRef<NotifyUnsupportedBrowserComponent>,
  ) {
  }

  ngOnInit(): void {
  }

  onClose(): void {
    this.dialogRef.close();
  }

}
