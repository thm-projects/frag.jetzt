import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export const AVAILABLE_LANGUAGES = ['en', 'de', 'fr'];

export type Language = (typeof AVAILABLE_LANGUAGES)[number];

@Injectable()
export class LanguageService {
  private readonly _language = new BehaviorSubject<Language>(null);

  constructor() {
    const data = localStorage.getItem('currentLang');
    let lang = null;
    if (AVAILABLE_LANGUAGES.includes(data)) {
      lang = data;
    }
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
  }

  currentLanguage(): Language {
    return this._language.value;
  }

  getLanguage(): Observable<Language> {
    return this._language.asObservable();
  }

  setLanguage(language: Language): void {
    this._language.next(language);
    localStorage.setItem('currentLang', language);
  }
}
