import { AfterViewInit, Component, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-qr-code-dialog',
  templateUrl: './qr-code-dialog.component.html',
  styleUrls: ['./qr-code-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class QrCodeDialogComponent implements AfterViewInit {
  data: string;
  qrWidth: number;
  key: string;
  readonly url = location.host;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<QrCodeDialogComponent>,
  ) {}

  ngAfterViewInit() {
    const minSize = Math.min(
      document.body.clientWidth,
      document.body.clientHeight,
    );
    this.qrWidth = minSize - minSize / 5;
  }

  onCloseClick(): void {
    this.dialogRef.close();
  }
}
