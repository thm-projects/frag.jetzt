import { Injectable } from '@angular/core';
import { AnswerText } from '../../models/answer-text';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { AnswerChoice } from '../../models/answer-choice';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class ContentAnswerService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    answer: '/answer',
    text: '/text',
    choice: '/choice',
    find: '/find'
  };

  constructor(private http: HttpClient) {
    super();
  }

  getAnswers(contentId: string): Observable<AnswerText[]> {
    const url = this.apiUrl.base + this.apiUrl.answer + this.apiUrl.find;
    return this.http.post<AnswerText[]>(url, {
      properties: { contentId: contentId },
      externalFilters: {}
    }, httpOptions).pipe(
      catchError(this.handleError('getAnswers', []))
    );
  }

  addAnswerText(answerText: AnswerText): Observable<AnswerText> {
    const url = this.apiUrl.base + this.apiUrl.answer + '/';
    return this.http.post<AnswerText>(url, answerText, httpOptions).pipe(
      catchError(this.handleError<AnswerText>('addAnswerText'))
    );
  }

  addAnswerChoice(answerChoice: AnswerChoice): Observable<AnswerChoice> {
    const url = this.apiUrl.base + this.apiUrl.answer + '/';
    return this.http.post<AnswerChoice>(url, answerChoice, httpOptions).pipe(
      catchError(this.handleError<AnswerChoice>('addAnswerChoice'))
    );
  }

  getAnswerText(id: string): Observable<AnswerText> {
    const url = `${ this.apiUrl.base + this.apiUrl.answer + this.apiUrl.text}/${ id }`;
    return this.http.get<AnswerText>(url).pipe(
      catchError(this.handleError<AnswerText>(`getAnswerText id=${ id }`))
    );
  }

  getAnswerChoice(id: string): Observable<AnswerChoice> {
    const url = `${ this.apiUrl.base + this.apiUrl.answer + this.apiUrl.choice }/${ id }`;
    return this.http.get<AnswerChoice>(url).pipe(
      catchError(this.handleError<AnswerChoice>(`getAnswerChoice id=${ id }`))
    );
  }

  updateAnswerText(updatedAnswerText: AnswerText): Observable<AnswerText> {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.answer + this.apiUrl.text}/${ updatedAnswerText.id }`;
    return this.http.put(connectionUrl, updatedAnswerText , httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<any>('updateAnswerText'))
    );
  }

  updateAnswerChoice(updatedAnswerChoice: AnswerChoice): Observable<AnswerChoice> {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.answer + this.apiUrl.choice}/${ updatedAnswerChoice.id }`;
    return this.http.put(connectionUrl, updatedAnswerChoice , httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<any>('updateAnswerChoice'))
    );
  }

  deleteAnswerText(id: string): Observable<AnswerText> {
    const url = `${ this.apiUrl.base + this.apiUrl.answer }/${ id }`;
    return this.http.delete<AnswerText>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<AnswerText>('deleteAnswerText'))
    );
  }

  deleteAnswerChoice(id: string): Observable<AnswerChoice> {
    const url = `${ this.apiUrl.base + this.apiUrl.answer }/${ id }`;
    return this.http.delete<AnswerChoice>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<AnswerChoice>('deleteAnswerText'))
    );
  }
}
