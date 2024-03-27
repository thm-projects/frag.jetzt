import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-notify-unsupported-browser',
  templateUrl: './notify-unsupported-browser.component.html',
  styleUrls: ['./notify-unsupported-browser.component.scss'],
})
export class NotifyUnsupportedBrowserComponent {
  constructor(
    private dialogRef: MatDialogRef<NotifyUnsupportedBrowserComponent>,
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
