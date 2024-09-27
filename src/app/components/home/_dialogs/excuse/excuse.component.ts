import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component } from '@angular/core';
import { language } from 'app/base/language/language';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-excuse',
  templateUrl: './excuse.component.html',
  styleUrls: ['./excuse.component.scss'],
})
export class ExcuseComponent {
  protected readonly lang = language;
  protected readonly i18n = i18n;
  constructor(private dialog: MatDialog) {}

  closeAllDialogs() {
    this.dialog.closeAll();
  }
}
