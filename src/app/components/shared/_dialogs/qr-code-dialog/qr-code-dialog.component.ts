import { AfterViewInit, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-qr-code-dialog',
  templateUrl: './qr-code-dialog.component.html',
  styleUrls: ['./qr-code-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class QrCodeDialogComponent implements OnInit, AfterViewInit {

  data: string;
  qrWidth: number;
  key: string;
  readonly url = location.host;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<QrCodeDialogComponent>,
  ) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const minSize = Math.min(document.body.clientWidth, document.body.clientHeight);
    this.qrWidth = minSize - (minSize / 5);
  }

  onCloseClick(): void {
    this.dialogRef.close();
  }
}
