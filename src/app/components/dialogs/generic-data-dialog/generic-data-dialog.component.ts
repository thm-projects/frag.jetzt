import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-generic-data-dialog',
  templateUrl: './generic-data-dialog.component.html',
  styleUrls: ['./generic-data-dialog.component.scss']
})
export class GenericDataDialogComponent {

  constructor(public dialogRef: MatDialogRef<GenericDataDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: Data[]) {
  }

  submit(): void {
    this.dialogRef.close(this.data);
  }
}

export class Data {
  id: string;
  label: string;
  value: string;

  // TODO: constructor needed?
  constructor(id: string, label: string, value?: string) {
    this.id = id;
    this.label = label;
    this.value = value;
  }
}
