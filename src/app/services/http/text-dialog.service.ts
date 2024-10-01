// text-dialog.service.ts
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { TextDialogComponent } from '../../components/shared/_dialogs/text-dialog/text-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class TextDialogService {
  constructor(private dialog: MatDialog) {}

  open(config: TextDialogConfig): MatDialogRef<TextDialogComponent> {
    return this.dialog.open(TextDialogComponent, {
      data: config,
      disableClose: !config.allowClose,
    });
  }
}

// Define the configuration interface
export interface TextDialogConfig {
  title: string;
  content: string;
  allowClose?: boolean;
  buttons: DialogButton[];
}

export type DialogResult =
  | { type: 'error'; text: string }
  | { type: 'completed' };

export interface DialogButton {
  type: 'button' | 'spacer';
  text?: string;
  onClick?: (
    dialogRef: MatDialogRef<TextDialogComponent>,
  ) => boolean | Observable<DialogResult>;
}
