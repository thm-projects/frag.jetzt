import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseHttpService } from './base-http.service';
import { catchError, tap, timeout } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CURRENT_SUPPORTED_LANGUAGES, Model } from './spacy.interface';

export type Language =
  | 'de'
  | 'de-AT'
  | 'de-CH'
  | 'de-DE'
  | 'en'
  | 'en-AU'
  | 'en-CA'
  | 'en-GB'
  | 'en-US'
  | 'fr'
  | 'es'
  | 'it'
  | 'nl'
  | 'nl-BE'
  | 'pt'
  | 'pt-BR'
  | 'pt-PT'
  | 'auto';

type FirstPart<T extends string> = T extends `${infer First}-${string}`
  ? First
  : T;

export interface LanguagetoolResult {
  software: {
    name: string;
    version: string;
    buildDate: string;
    apiVersion: number;
    status?: string;
    premium?: boolean;
    premiumHint?: string;
  };
  language: {
    name: string;
    code: string;
    detectedLanguage: {
      name: string;
      code: string;
      confidence?: number;
    };
  };
  matches: {
    message: string;
    shortMessage?: string;
    offset: number;
    length: number;
    replacements: {
      value?: string;
    }[];
    context: {
      text: string;
      offset: number;
      length: number;
    };
    sentence: string;
    rule?: {
      id: string;
      subId?: string;
      description: string;
      urls?: {
        value?: string;
      }[];
      issueType?: string;
      category: {
        id?: string;
        name?: string;
      };
    };
    contextForSureMatch?: number;
    ignoreForIncompleteSentence?: boolean;
    type?: {
      typeName?: string;
    };
  }[];
  warnings?: {
    incompleteResults?: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class LanguagetoolService extends BaseHttpService {
  constructor(private http: HttpClient) {
    super();
  }

  mapLanguageToSpacyModel(language: Language): Model {
    return language.split('-', 1)[0] as FirstPart<Language>;
  }

  isSupportedLanguage(language: Language) {
    return CURRENT_SUPPORTED_LANGUAGES.includes(
      this.mapLanguageToSpacyModel(language),
    );
  }

  checkSpellings(
    text: string,
    language: Language,
  ): Observable<LanguagetoolResult> {
    const url = '/languagetool';
    return (
      this.checkCanSendRequest('checkSpellings') ||
      this.http
        .get<LanguagetoolResult>(url, {
          params: {
            text,
            language,
          },
        })
        .pipe(
          tap(() => ''),
          timeout(4500),
          catchError(this.handleError<LanguagetoolResult>('checkSpellings')),
        )
    );
  }
}
