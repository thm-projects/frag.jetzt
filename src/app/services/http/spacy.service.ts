import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { catchError, map } from 'rxjs/operators';

export type Model = 'de' | 'en' | 'fr' | 'auto';

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
    return this.analyse(text, model).pipe(
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
