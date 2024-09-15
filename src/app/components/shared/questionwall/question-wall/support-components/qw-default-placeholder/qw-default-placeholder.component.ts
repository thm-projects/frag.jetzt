import { Component } from '@angular/core';
import i18nRaw from '../../translation/qw.i18n.json';
import { I18nLoader } from '../../../../../../base/i18n/i18n-loader';

const i18n = I18nLoader.load(i18nRaw);

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'qw-default-placeholder',
  standalone: true,
  imports: [],
  templateUrl: './qw-default-placeholder.component.html',
  styleUrl: './qw-default-placeholder.component.scss',
})
export class QwDefaultPlaceholderComponent {
  protected readonly i18n = i18n;
}
