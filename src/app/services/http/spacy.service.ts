import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseHttpService } from './base-http.service';
import { catchError } from 'rxjs/operators';

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

  analyse(text: string, model: string): Observable<Result> {
    const url = '/spacy';
    return this.http.post<Result>(url, {text, model}, httpOptions)
      .pipe(
        catchError(this.handleError<any>('analyse'))
      );
  }
  checkLanguage(data) {
    const url = '/languagetool';
    return this.http.post<Result>(url, data, httpOptions)
      .pipe(
        catchError(this.handleError<any>('checkLanguage'))
      );
  }
}
