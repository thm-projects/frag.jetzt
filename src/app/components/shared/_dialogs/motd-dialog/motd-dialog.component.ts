import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Motd } from '../../../../models/motd';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-patch-dialog',
  templateUrl: './motd-dialog.component.html',
  styleUrls: ['./motd-dialog.component.scss']
})
export class MotdDialogComponent implements OnInit {

  motd: Motd;
  dismiss = false;
  currentLang = 'en';

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<MotdDialogComponent>
  ) {
    this.currentLang = localStorage.getItem('currentLang');
    console.log(localStorage);
  }

  ngOnInit(): void {
  }

  setDismiss(e: MatCheckboxChange) {
    this.dismiss = e.checked;
  }

  buildCloseDialogActionCallback(): () => void {
    return () => this.closeDialog();
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
