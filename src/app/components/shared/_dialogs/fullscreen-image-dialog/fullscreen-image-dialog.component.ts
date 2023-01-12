import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-fullscreen-image-dialog',
  templateUrl: './fullscreen-image-dialog.component.html',
  styleUrls: ['./fullscreen-image-dialog.component.scss'],
})
export class FullscreenImageDialogComponent implements OnInit {
  @Input() src: string;
  clicked = '';

  constructor(
    private dialogRef: MatDialogRef<FullscreenImageDialogComponent>,
  ) {}

  ngOnInit(): void {}

  changeClick() {
    this.clicked = this.clicked ? '' : 'clicked';
  }

  onCloseClick(): void {
    this.dialogRef.close();
  }
}
