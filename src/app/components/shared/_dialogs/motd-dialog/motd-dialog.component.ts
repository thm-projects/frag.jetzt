import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Motd } from '../../../../models/motd';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-patch-dialog',
  templateUrl: './motd-dialog.component.html',
  styleUrls: ['./motd-dialog.component.scss']
})
export class MotdDialogComponent implements OnInit {
  
  motd: Motd;
  dismiss = false;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<MotdDialogComponent>
  ) { }

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
