import rawI18n from './i18n.json';
import { Component } from '@angular/core';
import { CookiesComponent } from '../cookies/cookies.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { language } from 'app/base/language/language';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { ExcuseComponent } from '../excuse/excuse.component';

const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss'],
})
export class DownloadComponent extends CookiesComponent {
  protected override readonly lang = language;
  protected readonly i18n = i18n;

  constructor(
    dialog: MatDialog, // Inject MatDialog here
    dialogRef: MatDialogRef<DownloadComponent>,
  ) {
    super(dialog, dialogRef); // Pass MatDialog to the parent component
  }

  // Method to show the excuse pop-up
  showExcusePopup() {
    this.dialog.open(ExcuseComponent, {});
  }
}
