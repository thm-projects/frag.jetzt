import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { CreateCommentKeywords } from '../../utils/create-comment-keywords';
import { DEFAULT_NOUN_LABELS, Model } from './spacy.interface';

export interface SpacyKeyword {
  lemma: string;
  dep: string[];
}

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
      .post<KeywordList>(url, { text, model }, httpOptions)
      .pipe(
        tap(_ => ''),
        timeout(500),
        catchError(this.handleError<any>('getKeywords')),
        map((elem: KeywordList) => {
          const keywordsMap = new Map<string, { lemma: string; dep: Set<string> }>();
          elem.forEach(e => {
            const keyword = e.lemma.trim();
            if (!CreateCommentKeywords.isKeywordAcceptable(keyword)) {
              return;
            }
            let keywordObj = keywordsMap.get(keyword);
            if (!keywordObj) {
              keywordObj = {
                lemma: keyword,
                dep: new Set<string>()
              };
              keywordsMap.set(keyword, keywordObj);
            }
            keywordObj.dep.add(e.dep);
          });
          return [...keywordsMap.values()].map(e => ({ lemma: e.lemma, dep: [...e.dep] }));
        })
      );
  }
}
