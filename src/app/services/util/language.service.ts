import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { ConfigurationService } from './configuration.service';

export const AVAILABLE_LANGUAGES = ['en', 'de', 'fr'];

export type Language = (typeof AVAILABLE_LANGUAGES)[number];

@Injectable()
export class LanguageService {
  private _currentLanguage: Language = null;
  private readonly _language = new ReplaySubject<Language>(1);
  private _initialized = false;

  constructor(
    private configurationService: ConfigurationService,
  ) {
  }

  init(storedLanguage: string) {
    if (this._initialized) {
      return;
    }
    let lang = AVAILABLE_LANGUAGES.includes(storedLanguage) ? storedLanguage : null;
    if (!lang) {
      for (const language of navigator.languages) {
        const langKey = language.split('-')[0].toLowerCase();
        if (AVAILABLE_LANGUAGES.includes(langKey)) {
          lang = langKey;
          break;
        }
      }
    }
    this.setLanguage(lang || AVAILABLE_LANGUAGES[0]);
    this._initialized = true;
  }

  currentLanguage(): Language {
    return this._currentLanguage;
  }

  getLanguage(): Observable<Language> {
    return this._language.asObservable();
  }

  setLanguage(language: Language): void {
    this._currentLanguage = language;
    this._language.next(language);
    this.configurationService.put('language', language).subscribe();
  }
}
