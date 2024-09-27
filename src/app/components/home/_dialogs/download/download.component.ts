import rawI18n from './i18n.json';
import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { language } from 'app/base/language/language';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { ExcuseComponent } from '../excuse/excuse.component';
import { badgeType, getAppStoreBadge, getPlayStoreBadge } from '../app-utility';

const i18n = I18nLoader.load(rawI18n);

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss'],
})
export class DownloadComponent {
  protected readonly lang = language;
  protected readonly i18n = i18n;
  protected readonly badgeType = badgeType;
  protected readonly getAppStoreBadge = getAppStoreBadge;
  protected readonly getPlayStoreBadge = getPlayStoreBadge;

  private dialog = inject(MatDialog);

  showExcusePopup() {
    this.dialog.open(ExcuseComponent);
  }
}
