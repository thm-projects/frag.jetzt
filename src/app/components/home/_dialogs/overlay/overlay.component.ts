import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent implements OnInit {
  deviceType: string;

  constructor(private dialogRef: MatDialogRef<OverlayComponent>) { }

  ngOnInit() {
  }

  showCookieModal() {
    this.dialogRef.close(true);
  }

}
