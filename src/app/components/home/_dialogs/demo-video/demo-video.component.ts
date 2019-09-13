import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-demo-video',
  templateUrl: './demo-video.component.html',
  styleUrls: ['./demo-video.component.scss']
})
export class DemoVideoComponent implements OnInit {

  deviceType: string;
  currentLang: string;

  constructor(public dialogRef: MatDialogRef<DemoVideoComponent>,
              public dialog: MatDialog) { }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
    document.getElementById('setFocus').focus();
  }


  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildCloseDialogActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
