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

@Component({
  selector: 'app-unsaved-changes-dialog',
  templateUrl: './unsaved-changes-dialog.component.html',
  styleUrls: ['./unsaved-changes-dialog.component.scss'],
  imports: [
    A11yModule,
    MatDialogModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
  ],
})
export class UnsavedChangesDialogComponent {
  constructor(public dialogRef: MatDialogRef<UnsavedChangesDialogComponent>) {}
  protected readonly i18n = i18n;

  onDiscard(): void {
    this.dialogRef.close('discard');
  }
}
