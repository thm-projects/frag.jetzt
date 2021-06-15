import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { catchError, map, tap } from 'rxjs/operators';

export type Model = 'de' | 'en' | 'fr' | 'es' | 'it' | 'nl' | 'pt' | 'auto';

//[B]egin, [I]nside, [O]utside or unset
type EntityPosition = 'B' | 'I' | 'O' | '';

interface NounToken {
  dep: string; // dependency inside the sentence
  // eslint-disable-next-line @typescript-eslint/naming-convention
  entity_pos: EntityPosition; // entity position
  // eslint-disable-next-line @typescript-eslint/naming-convention
  entity_type: string; // entity type
  lemma: string; // lemma of token
  tag: string; // tag of token
  text: string; // text of token
}

type NounCompound = NounToken[];
type NounCompoundList = NounCompound[];

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

  private static processCompound(result: string[], data: NounCompound) {
    let isInEntity = false;
    let start = 0;
    const pushNew = (i: number) => {
      if (start < i) {
        result.push(data.slice(start, i).reduce((acc, current) => acc + ' ' + current.lemma, ''));
        start = i;
      }
    };
    data.forEach((noun, i) => {
      if (noun.entity_pos === 'B' || (noun.entity_pos === 'I' && !isInEntity)) {
        // entity begins
        pushNew(i);
        isInEntity = true;
      } else if (isInEntity) {
        if (noun.entity_pos === '' || noun.entity_pos === 'O') {
          // entity ends
          pushNew(i);
          isInEntity = false;
        }
      }
    });
    pushNew(data.length);
  }

  getKeywords(text: string, model: Model): Observable<string[]> {
    const url = '/spacy';
    return this.http.post<NounCompoundList>(url, {text, model}, httpOptions)
      .pipe(
        tap(_ => ''),
        catchError(this.handleError<any>('getKeywords')),
        map((result: NounCompoundList) => {
          const filteredNouns: string[] = [];
          result.forEach(compound => {
            SpacyService.processCompound(filteredNouns, compound);
          });
          return filteredNouns;
        })
      );
  }
}
