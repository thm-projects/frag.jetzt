import { LanguageService } from '../../../../services/util/language.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

export class LivepollComponentUtility {
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
