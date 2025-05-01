import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, OnInit, OnDestroy } from '@angular/core';
import { language } from 'app/base/language/language';
import { AppTitleStrategy } from 'app/services/title/app-title-strategy';

@Component({
  selector: 'app-data-protection',
  templateUrl: './data-protection.component.html',
  styleUrls: ['./data-protection.component.scss'],
  standalone: false,
})
export class DataProtectionComponent implements OnInit, OnDestroy {
  protected readonly lang = language;
  protected readonly i18n = i18n;

  constructor(private readonly titleStrategy: AppTitleStrategy) {}

  ngOnInit(): void {
    // Set the dialog title when opening using the i18n key DATA_PROTECTION_DIALOG
    this.titleStrategy.setDialogTitle('DATA_PROTECTION_DIALOG');
  }

  ngOnDestroy(): void {
    // Restore the original title when the dialog is closed
    this.titleStrategy.restoreOriginalTitle();
  }
}
