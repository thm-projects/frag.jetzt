import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { catchError, map, tap } from 'rxjs/operators';

export type Model = 'de' | 'en' | 'fr';

export class Result {
  arcs: Arc[];
  words: Word[];

  constructor(
    arcs: Arc[] = [],
    words: Word[] = []
  ) {
    this.arcs = arcs;
    this.words = words;
  }

  static empty(): Result {
    return new Result();
  }
}

export class Word {
  tag: string;
  text: string;

  constructor(
    tag: string,
    text: string
  ) {
    this.tag = tag;
    this.text = text;
  }
}

export class Noun {
  text: string;
  dependencyRelation: string;

  constructor(
    text: string,
    dependencyRelation: string
  ) {
    this.text = text;
    this.dependencyRelation = dependencyRelation;
  }
}

export class Arc {
  dir: string;
  end: number;
  label: string;
  start: number;
  text: string;

  constructor(
    dir: string,
    end: number,
    label: string,
    start: number,
    text: string,
  ) {
    this.dir = dir;
    this.end = end;
    this.label = label;
    this.start = start;
    this.text = text;
  }

}


const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class SpacyService extends BaseHttpService {

  constructor(private http: HttpClient) {
    super();
  }

  getKeywords(text: string, model: string): Observable<string[]> {
    console.log(text);
    return this.analyse(text, model).pipe(
      tap(e => {
        const nouns: Noun[] = [];
        const absoluteNouns = e.words.filter((v, index) => {
          v['index'] = index;
          return v.tag.charAt(0) === 'N';
        });
        console.log(e);
        for (const arc of e.arcs) {
          const index = arc.dir.charAt(0) === 'r' ? arc.end : arc.start;
          const elem = e.words[index];
          if (elem.tag.charAt(0) === 'N') {
            while (absoluteNouns[0]['index'] < index) {
              const current = absoluteNouns.splice(0, 1)[0];
              console.log(current);
              nouns.push(new Noun(current['text'], 'ROOT'));
            }
            const actualNode = absoluteNouns.splice(0, 1)[0];
            console.log(actualNode);
            console.assert(actualNode['index'] === index, 'Indices should be equal!');
            nouns.push(new Noun(elem.text, arc.label));
          }
        }
        console.log(nouns);
      }),
      map(result => result.words.filter(v => v.tag.charAt(0) === 'N').map(v => v.text))
    );
  }

  analyse(text: string, model: string): Observable<Result> {
    const url = '/spacy';
    return this.http.post<Result>(url, {text, model}, httpOptions)
      .pipe(
        catchError(this.handleError<any>('analyse'))
      );
  }
}
