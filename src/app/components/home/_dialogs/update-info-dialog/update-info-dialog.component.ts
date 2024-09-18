import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component } from '@angular/core';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-update-info-dialog',
  templateUrl: './update-info-dialog.component.html',
  styleUrls: ['./update-info-dialog.component.scss'],
  standalone: true,
  imports: [CustomMarkdownModule, MatDialogModule, MatButtonModule],
})
export class UpdateInfoDialogComponent {
  protected readonly i18n = i18n;

  constructor(private dialogRef: MatDialogRef<UpdateInfoDialogComponent>) {}

  public static open(dialog: MatDialog) {
    const ref = dialog.open(UpdateInfoDialogComponent, {
      disableClose: true,
    });
    return ref;
  }

  protected install() {
    location.reload();
    this.dialogRef.close(true);
  }
}
