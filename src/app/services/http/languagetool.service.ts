import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseHttpService } from './base-http.service';
import { catchError } from 'rxjs/operators';
import { Model } from './spacy.service';
import { Observable } from 'rxjs';

export type Language =  'de-DE' | 'en-US' | 'fr' | 'auto';

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
        return 'fr'
      default:
        return 'de'
    }
  }

  checkSpellings(text: string, language: Language): Observable<any> {
    const url = '/languagetool';
    return this.http.get(url, {params: {
      text, language
    }})
      .pipe(
        catchError(this.handleError<any>('checkSpellings'))
      );
  }
}
