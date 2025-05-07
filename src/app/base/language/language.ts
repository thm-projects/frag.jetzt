import { signal } from '@angular/core';
import { dataService } from '../db/data-service';

export const AVAILABLE_LANGUAGES = ['en', 'de', 'fr'] as const;
export type Language = (typeof AVAILABLE_LANGUAGES)[number];

function getLanguageFromNavigator(): Language {
  for (const navLang of navigator.languages) {
    const key = navLang.split('-', 1)[0].toLowerCase() as Language;
    if (AVAILABLE_LANGUAGES.includes(key)) {
      return key;
    }
  }
  return 'en';
}

const languageSignal = signal<Language>(getLanguageFromNavigator());
export const language = languageSignal.asReadonly();

export function setLanguage(lang?: Language): boolean {
  if (!lang || !AVAILABLE_LANGUAGES.includes(lang)) {
    languageSignal.set('en');
    return false;
  }
  languageSignal.set(lang);
  dataService.config
    .createOrUpdate({ key: 'language', value: lang })
    .subscribe();
  return true;
}

dataService.config.get('language').subscribe((cfg) => {
  const stored = cfg?.value as Language | undefined;
  if (stored && AVAILABLE_LANGUAGES.includes(stored)) {
    languageSignal.set(stored);
  }
});
