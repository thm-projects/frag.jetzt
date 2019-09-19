import { Component, OnInit } from '@angular/core';
import { DialogConfirmActionButtonType } from '../../dialog/dialog-action-buttons/dialog-action-buttons.component';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-help',
  templateUrl: './help-page.component.html',
  styleUrls: ['./help-page.component.scss']
})
export class HelpPageComponent implements OnInit {

  deviceType: string;
  currentLang: string;

  constructor(private dialogRef: MatDialogRef<HelpPageComponent>) {
  }

  ngOnInit() {
    this.currentLang = localStorage.getItem('currentLang');
  }


  close(type: string): void {
    this.dialogRef.close(type);
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.close('abort');
  }
}
