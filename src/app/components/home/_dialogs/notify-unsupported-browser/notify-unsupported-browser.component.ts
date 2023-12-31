import { Component, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-notify-unsupported-browser',
  templateUrl: './notify-unsupported-browser.component.html',
  styleUrls: ['./notify-unsupported-browser.component.scss'],
})
export class NotifyUnsupportedBrowserComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<NotifyUnsupportedBrowserComponent>,
  ) {}

  ngOnInit(): void {}

  onClose(): void {
    this.dialogRef.close();
  }
}
