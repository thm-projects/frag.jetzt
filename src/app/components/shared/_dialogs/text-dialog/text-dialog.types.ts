import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { TextDialogComponent } from './text-dialog.component';

export type DialogResult =
  | boolean
  | void
  | { type: 'error'; text: string }
  | { type: 'completed' };

export interface Spacer {
  type: 'spacer';
}

export interface DialogButton {
  type: 'button';
  // https://m3.material.io/components/all-buttons#779012a4-8136-4a15-8b92-28af837d7ee2
  emphasis?:
    | 'high-filled'
    | 'medium-tonal'
    | 'medium-elevated'
    | 'medium-outlined'
    | 'low-text';
  icon?: string;
  svgIcon?: string;
  text: string;
  onClick: (
    dialogRef: MatDialogRef<TextDialogComponent>,
  ) => DialogResult | Observable<DialogResult> | Promise<DialogResult>;
}

export type DialogAction = Spacer | DialogButton;

export interface TextDialogConfig {
  title: string;
  content: string;
  allowClose?: boolean;
  actions: DialogAction[];
}
