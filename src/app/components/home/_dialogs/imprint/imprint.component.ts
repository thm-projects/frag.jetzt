import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss']
})
export class ImprintComponent implements OnInit {
  deviceType: string;
  currentLang: string;

  constructor(private dialogRef: MatDialogRef<ImprintComponent>) {
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
  }

  /**
   * Returns a lambda which closes the dialog on call.
   */
  buildDeclineActionCallback(): () => void {
    return () => this.dialogRef.close();
  }
}
