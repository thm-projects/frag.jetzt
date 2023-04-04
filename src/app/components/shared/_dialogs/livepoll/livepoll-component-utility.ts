import { LanguageService } from '../../../../services/util/language.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { animate, style, transition, trigger } from '@angular/animations';

const animateOpen = {
  opacity: 1,
  height: '*',
};

const animateClosed = {
  opacity: 0,
  height: '0px',
};

export class LivepollComponentUtility {
  static readonly animation = [
    trigger('AnimateInOut', [
      transition(':enter', [
        style(animateClosed),
        animate('200ms ease-in-out', style(animateOpen)),
      ]),
      transition(':leave', [
        animate('200ms ease-in-out', style(animateClosed)),
      ]),
      transition('open <=> closed', [animate('0.5s')]),
    ]),
  ];
  static initLanguage(
    languageService: LanguageService,
    translationService: TranslateService,
    http: HttpClient,
    _destroyer: ReplaySubject<any>,
  ) {
    languageService
      .getLanguage()
      .pipe(takeUntil(_destroyer))
      .subscribe((lang) => {
        translationService.use(lang);
        http
          .get('/assets/i18n/livepoll/' + lang + '.json')
          .subscribe((translation) => {
            translationService.setTranslation(lang, translation, true);
          });
      });
  }
}
