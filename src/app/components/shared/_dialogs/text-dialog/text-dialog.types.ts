import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { TextDialogComponent } from './text-dialog.component';

export type DialogResult =
  | { type: 'error'; text: string }
  | { type: 'completed' };

export interface Spacer {
  type: 'spacer';
}

export interface DialogButton {
  type: 'button';
  text: string;
  onClick: (
    dialogRef: MatDialogRef<TextDialogComponent>,
  ) => boolean | Observable<DialogResult> | Promise<DialogResult>;
}

export type DialogAction = Spacer | DialogButton;

export interface TextDialogConfig {
  title: string;
  content: string;
  allowClose?: boolean;
  actions: DialogAction[];
}
