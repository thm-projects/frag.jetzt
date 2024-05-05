import { signal } from '@angular/core';

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
export const setLanguage = (lang: Language) => {
  if (!AVAILABLE_LANGUAGES.includes(lang)) {
    console.error('Tried to set "' + lang + '" as language!');
    return;
  }
  languageSignal.set(lang);
};
