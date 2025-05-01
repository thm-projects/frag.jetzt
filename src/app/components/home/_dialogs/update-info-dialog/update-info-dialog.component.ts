import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CustomMarkdownModule } from 'app/base/custom-markdown/custom-markdown.module';
import { MatButtonModule } from '@angular/material/button';
import { AppTitleStrategy } from 'app/services/title/app-title-strategy';

@Component({
  selector: 'app-update-info-dialog',
  templateUrl: './update-info-dialog.component.html',
  styleUrls: ['./update-info-dialog.component.scss'],
  imports: [CustomMarkdownModule, MatDialogModule, MatButtonModule],
})
export class UpdateInfoDialogComponent implements OnInit, OnDestroy {
  protected readonly i18n = i18n;

  constructor(
    private readonly dialogRef: MatDialogRef<UpdateInfoDialogComponent>,
    private readonly titleStrategy: AppTitleStrategy,
  ) {}

  ngOnInit(): void {
    // Set the dialog title when the dialog is opened
    this.titleStrategy.setDialogTitle('UPDATE_INFO_DIALOG');
  }

  ngOnDestroy(): void {
    // Restore the original title when the dialog is closed
    this.titleStrategy.restoreOriginalTitle();
  }

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
