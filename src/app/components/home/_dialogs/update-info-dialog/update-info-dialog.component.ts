import { Component } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-update-info-dialog',
  templateUrl: './update-info-dialog.component.html',
  styleUrls: ['./update-info-dialog.component.scss'],
})
export class UpdateInfoDialogComponent {
  public readonly onSubmit = this.install.bind(this);
  public readonly onCancel = this.close.bind(this);

  constructor(private dialogRef: MatDialogRef<UpdateInfoDialogComponent>) {}

  public static open(dialog: MatDialog) {
    const ref = dialog.open(UpdateInfoDialogComponent, {
      disableClose: true,
    });
    return ref;
  }

  private close() {
    this.dialogRef.close(false);
  }

  private install() {
    location.reload();
    this.dialogRef.close(true);
  }
}
