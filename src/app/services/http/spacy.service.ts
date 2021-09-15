import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { CreateCommentKeywords } from '../../utils/create-comment-keywords';
import { DEFAULT_NOUN_LABELS, Model } from './spacy.interface';

export interface SpacyKeyword {
  text: string;
  dep: string[];
}

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class SpacyService extends BaseHttpService {

  constructor(private http: HttpClient) {
    super();
  }

  static getLabelsForModel(model: Model): string[] {
    return DEFAULT_NOUN_LABELS[model];
  }

  getKeywords(text: string, model: Model): Observable<SpacyKeyword[]> {
    const url = '/spacy';
    return this.checkCanSendRequest('getKeywords') || this.http
      .post<SpacyKeyword[]>(url, { text, model }, httpOptions)
      .pipe(
        tap(_ => ''),
        timeout(2500),
        catchError(this.handleError<any>('getKeywords')),
        map((elem: SpacyKeyword[]) => elem.filter(e => CreateCommentKeywords.isKeywordAcceptable(e.text)))
      );
  }
}
