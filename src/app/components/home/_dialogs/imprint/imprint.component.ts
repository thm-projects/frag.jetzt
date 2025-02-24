import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import { Component } from '@angular/core';
import { language } from 'app/base/language/language';

@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.component.html',
  styleUrls: ['./imprint.component.scss'],
  standalone: false,
})
export class ImprintComponent {
  protected readonly lang = language;
  protected readonly i18n = i18n;
}
