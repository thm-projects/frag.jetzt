import rawI18n from './i18n.json';
import { Component } from '@angular/core';
import { CookiesComponent } from '../cookies/cookies.component';
const i18n = I18nLoader.load(rawI18n);
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { language } from 'app/base/language/language';
import { I18nLoader } from 'app/base/i18n/i18n-loader';

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss'],
})
export class DownloadComponent extends CookiesComponent {
  protected override readonly lang = language;
  protected readonly i18n = i18n;

  constructor(dialog: MatDialog, dialogRef: MatDialogRef<DownloadComponent>) {
    super(dialog, dialogRef);
  }
}
