import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.loadModule(rawI18n);
import { Component, Signal, computed, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { GdprSource } from '../gdpr-types';
import { i18nContext } from 'app/base/i18n/i18n-context';

const MAPPER = {
  [GdprSource.External]: 'embedded',
  [GdprSource.ExternalUntrusted]: 'external',
  [GdprSource.Vimeo]: 'vimeo',
  [GdprSource.YouTube]: 'youtube',
} as const;

type Values = (typeof MAPPER)[keyof typeof MAPPER];

@Component({
  selector: 'app-gdpr-notice',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './gdpr-notice.component.html',
  styleUrl: './gdpr-notice.component.scss',
})
export class GdprNoticeComponent {
  source = input.required<GdprSource>();
  url = input.required<string>();
  dummy = input.required<HTMLElement>();
  iframe = input.required<HTMLIFrameElement>();
  style = input.required<CSSStyleDeclaration>();
  onSubmit = output();
  protected readonly i18n = i18n;
  protected readonly option: Signal<Values | 'unknown'> = computed(() => {
    return MAPPER[this.source()] || 'unknown';
  });
  protected readonly content = computed(() => {
    return i18nContext(i18n()[this.option()].content, {
      url: this.url(),
    });
  });
}
