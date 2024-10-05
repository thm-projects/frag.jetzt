import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { DEFAULT_NOUN_LABELS, Model } from './spacy.interface';
import { KeywordExtractor } from '../../utils/keyword-extractor';

export interface SpacyKeyword {
  text: string;
  dep: string[];
}

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class SpacyService extends BaseHttpService {
  constructor(private http: HttpClient) {
    super();
  }

  static getLabelsForModel(model: Model): string[] {
    return DEFAULT_NOUN_LABELS[model];
  }

  getKeywords(
    text: string,
    model: Model,
    brainstorming: boolean,
  ): Observable<SpacyKeyword[]> {
    const url = '/spacy';
    return (
      this.checkCanSendRequest('getKeywords') ||
      this.http
        .post<
          SpacyKeyword[]
        >(url, { text, model, brainstorming: String(brainstorming) }, httpOptions)
        .pipe(
          tap(() => ''),
          timeout(2500),
          catchError(this.handleError<SpacyKeyword[]>('getKeywords')),
          map((elem: SpacyKeyword[]) =>
            elem.filter((e) => KeywordExtractor.isKeywordAcceptable(e.text)),
          ),
        )
    );
  }

  getLemma(text: string, model: Model): Observable<{ text: string }> {
    const url = '/lemmatize';
    return (
      this.checkCanSendRequest('getLemma') ||
      this.http.post<{ text: string }>(url, { text, model }, httpOptions).pipe(
        tap(() => ''),
        timeout(2500),
        catchError(this.handleError<{ text: string }>('getLemma')),
      )
    );
  }
}
