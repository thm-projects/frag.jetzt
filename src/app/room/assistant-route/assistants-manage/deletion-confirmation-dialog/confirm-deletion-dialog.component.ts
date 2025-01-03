import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogRef,
  MatDialogModule,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
} from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { NgFor } from '@angular/common';

export type DialogResult = 'canceled' | 'confirmed';

@Component({
  selector: 'app-confirm-deletion-dialog',
  templateUrl: './confirm-deletion-dialog.component.html',
  styleUrls: ['./confirm-deletion-dialog.component.scss'],
  imports: [
    A11yModule,
    MatDialogModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    NgFor,
  ],
})
export class ConfirmDeletionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<
      ConfirmDeletionDialogComponent,
      DialogResult
    >,
  ) {}
  protected readonly i18n = i18n;

  onCancel(): void {
    this.dialogRef.close('canceled');
  }

  onDeleteAssistant(): void {
    this.dialogRef.close('confirmed');
  }
}
