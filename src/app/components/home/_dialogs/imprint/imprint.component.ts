import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component, OnInit, OnDestroy } from '@angular/core';
import { language } from 'app/base/language/language';
import { AppTitleStrategy } from 'app/services/title/app-title-strategy';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss'],
  standalone: false,
})
export class ImprintComponent implements OnInit, OnDestroy {
  protected readonly lang = language;
  protected readonly i18n = i18n;

  constructor(private readonly titleStrategy: AppTitleStrategy) {}

  ngOnInit(): void {
    // Setzt den Dialogtitel beim Öffnen
    this.titleStrategy.setDialogTitle('IMPRINT_DIALOG');
  }

  ngOnDestroy(): void {
    // Stellt den ursprünglichen Titel beim Schließen wieder her
    this.titleStrategy.restoreOriginalTitle();
  }
}
