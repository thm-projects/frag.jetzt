import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";

export class Result {
  arcs: Arc[];
  words: Word[]
  static Empty() { return new Result(); }
  constructor(
    arcs: Arc[] = [],
    words: Word[] = []
  ) {
    this.arcs = arcs;
    this.words = words;
  }
}

export class Word {
  tag: string
  text: string

  constructor(
    tag: string,
    text: string)
  {
    this.tag = tag;
    this.text = text;
  }
}

export class Arc {
  dir: string
  end: number
  label: string
  start: number
  text: string

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
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class SpacyService {

  constructor(private http: HttpClient) { }

  analyse(text: string, model: string): Observable<Result> {
    const url = '/spacy'
    return this.http.post<Result>(url,
      { 'text': text, 'model': model },
      httpOptions)
  }
}
