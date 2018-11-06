import { Component } from '@angular/core';
import { GenericDataDialogComponent } from '../../../shared/_dialogs/generic-data-dialog/generic-data-dialog.component';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'app-markdown-help-dialog',
  templateUrl: './markdown-help-dialog.component.html',
  styleUrls: ['./markdown-help-dialog.component.scss']
})
export class MarkdownHelpDialogComponent {

  constructor(public dialogRef: MatDialogRef<GenericDataDialogComponent>) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
