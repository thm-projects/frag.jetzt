import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseHttpService } from './base-http.service';
import { catchError } from 'rxjs/operators';
import { Model } from './spacy.service';
import { Observable } from 'rxjs';

export type Language = 'de-DE' | 'en-US' | 'fr' | 'auto';

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
  providedIn: 'root'
})
export class LanguagetoolService extends BaseHttpService {

  constructor(private http: HttpClient) {
    super();
  }

  mapLanguageToSpacyModel(language: Language): Model {
    switch (language) {
      case 'de-DE':
        return 'de';
      case 'en-US':
        return 'en';
      case 'fr':
        return 'fr';
      default:
        return 'auto';
    }
  }

  checkSpellings(text: string, language: Language): Observable<LanguagetoolResult> {
    const url = '/languagetool';
    return this.http.get<LanguagetoolResult>(url, {
      params: {
        text, language
      }
    }).pipe(
      catchError(this.handleError<any>('checkSpellings'))
    );
  }
}
