import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface MarkdownEditorDialogData {
  data: string;
}

@Component({
  selector: 'app-markdown-editor-dialog',
  templateUrl: './markdown-editor-dialog.component.html',
  styleUrls: ['./markdown-editor-dialog.component.scss'],
})
export class MarkdownEditorDialogComponent {
  public data: string;

  constructor(
    public readonly dialogRef: MatDialogRef<MarkdownEditorDialogData>,
    @Inject(MAT_DIALOG_DATA)
    public readonly injection: MarkdownEditorDialogData,
  ) {
    this.data = injection.data;
  }
}
