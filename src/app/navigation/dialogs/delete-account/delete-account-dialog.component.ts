import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { A11yModule } from '@angular/cdk/a11y';

const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-delete-account-dialog',
  templateUrl: './delete-account-dialog.component.html',
  styleUrls: ['./delete-account-dialog.component.scss'],
  imports: [
    A11yModule,
    MatDialogModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
  ],
})
export class DeleteAccountDialogComponent {
  constructor(public dialogRef: MatDialogRef<DeleteAccountDialogComponent>) {}
  protected readonly i18n = i18n;

  static openDialog(
    dialog: MatDialog,
  ): MatDialogRef<DeleteAccountDialogComponent> {
    return dialog.open(DeleteAccountDialogComponent);
  }

  onContinue(): void {
    this.dialogRef.close('continue');
  }

  onDiscard(): void {
    this.dialogRef.close('discard');
  }
}
