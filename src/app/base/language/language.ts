import { signal } from '@angular/core';
import { dataService } from '../db/data-service';

export const AVAILABLE_LANGUAGES = ['en', 'de', 'fr'] as const;
export type Language = (typeof AVAILABLE_LANGUAGES)[number];

const getLanguageFromNavigator = () => {
  for (const language of navigator.languages) {
    const langKey = language.split('-', 1)[0].toLowerCase() as Language;
    if (AVAILABLE_LANGUAGES.includes(langKey)) {
      return langKey;
    }
  }
  return 'en';
};

const languageSignal = signal<Language>(getLanguageFromNavigator());
export const language = languageSignal.asReadonly();
export const setLanguage = (lang: Language): boolean => {
  if (!AVAILABLE_LANGUAGES.includes(lang)) {
    console.error('Tried to set "' + lang + '" as Language!');
    return false;
  }
  languageSignal.set(lang);
  dataService.config
    .createOrUpdate({
      key: 'language',
      value: lang,
    })
    .subscribe();
  return true;
};

// side effect
dataService.config.get('language').subscribe((lang) => {
  setLanguage(lang?.value as Language);
});
