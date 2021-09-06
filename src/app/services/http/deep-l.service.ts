import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { flatMap } from 'rxjs/internal/operators';

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
};

interface DeepLResult {
  translations: {
    detected_source_language: string;
    text: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DeepLService extends BaseHttpService {

  constructor(private http: HttpClient) {
    super();
  }

  improveTextStyle(text: string): Observable<string> {
    return this.makeTranslateRequest([text], 'EN-US').pipe(
      flatMap(result =>
        this.makeTranslateRequest([result.translations[0].text], result.translations[0].detected_source_language)),
      map(result => result.translations[0].text)
    );
  }

  private makeTranslateRequest(text: string[], targetLang: string): Observable<DeepLResult> {
    const url = '/deepl/translate';
    console.assert(text.length > 0, 'You need at least one text entry.');
    console.assert(text.length <= 50, 'Maximum 50 text entries are allowed');
    const additional = '?target_lang=' + encodeURIComponent(targetLang) +
      '&text=' + text.map(e => encodeURIComponent(e)).join('&text=');
    return this.http.get<string>(url + additional, httpOptions)
      .pipe(
        tap(_ => ''),
        catchError(this.handleError<any>('makeTranslateRequest')),
      );
  }
}
