import { LanguageService } from '../../../../services/util/language.service';
import { ReplaySubject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { animate, style, transition, trigger } from '@angular/animations';
import { LivepollTemplateContext } from '../../../../models/livepoll-template';
import { LivepollOptionEntry } from './livepoll-dialog/livepoll-dialog.component';

const animateOpen = {
  opacity: 1,
  height: '*',
};

const animateClosed = {
  opacity: 0,
  height: '0px',
};

export interface TemplateTarget {
  votes: number[];
  template: LivepollTemplateContext;
  rowHeight: number;
  options: LivepollOptionEntry[];
}

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

  static initTemplate(target: TemplateTarget) {
    target.votes = new Array(
      target.template.symbols?.length || target.template.length,
    ).fill(0);
    target.rowHeight = Math.ceil(target.votes.length / 2);
    if (typeof target.template.length === 'undefined') {
      target.options = target.template.symbols.map((option, index) => ({
        index,
        symbol: option,
      }));
    } else {
      const options: {
        index: number;
        symbol: string;
      }[] = [];
      for (let index = 0; index < target.template.length; index++) {
        options.push({
          index,
          symbol: 'option-' + target.template.name,
        });
      }
      target.options = options;
    }
  }
}
