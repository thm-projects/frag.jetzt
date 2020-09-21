import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Patch } from '../../../../models/patch';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-patch-dialog',
  templateUrl: './patch-dialog.component.html',
  styleUrls: ['./patch-dialog.component.scss']
})
export class PatchDialogComponent implements OnInit {

  patch: Patch;
  dismiss = false;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<PatchDialogComponent>
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
