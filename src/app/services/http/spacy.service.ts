import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { catchError, map, tap } from 'rxjs/operators';

export type Model = 'de' | 'en' | 'fr' | 'es' | 'it' | 'nl' | 'pt' | 'auto';

type KeywordType = 'entity' | 'noun';

interface NounKeyword {
  type: KeywordType;
  lemma: string;
  text: string;
  dep: string;
  tag: string;
  pos: string;
}

interface EntityKeyword extends NounKeyword {
  entityType: string;
}

type AbstractKeyword = NounKeyword | EntityKeyword;

type KeywordList = AbstractKeyword[];

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class SpacyService extends BaseHttpService {

  constructor(private http: HttpClient) {
    super();
  }

  getKeywords(text: string, model: Model): Observable<string[]> {
    const url = '/spacy';
    return this.http.post<KeywordList>(url, {text, model}, httpOptions)
      .pipe(
        tap(_ => ''),
        catchError(this.handleError<any>('getKeywords')),
        map((result: KeywordList) => {
          const keywords = [];
          result.forEach(e => {
            const keyword = e.type === 'entity' ? e.text.trim() : e.lemma.trim();
            if (keywords.findIndex(word => word === keyword) < 0) {
              keywords.push(keyword);
            }
          });
          return keywords;
        })
      );
  }
}
