import { Injectable } from '@angular/core';
import { AnswerText } from '../../models/answer-text';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { AnswerChoice } from '../../models/answer-choice';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class ContentAnswerService extends BaseHttpService {
  private textAnswerUrl = 'api/textAnswers';
  private choiceAnswerUrl = 'api/choiceAnswers';

  constructor(private http: HttpClient) {
    super();
  }

  getTextAnswers(contentId: string): Observable<AnswerText[]> {
    const url = `${this.textAnswerUrl}/?contentId=${contentId}`;
    return this.http.get<AnswerText[]>(url).pipe(
      catchError(this.handleError('getTextAnswers', []))
    );
  }

  getChoiceAnswers(contentId: string): Observable<AnswerText[]> {
    const url = `${this.choiceAnswerUrl}/?contentId=${contentId}`;
    return this.http.get<AnswerText[]>(url).pipe(
      catchError(this.handleError('getChoiceAnswers', []))
    );
  }

  addAnswerText(answerText: AnswerText): Observable<AnswerText> {
    return this.http.post<AnswerText>(this.textAnswerUrl, answerText, httpOptions).pipe(
      catchError(this.handleError<AnswerText>('addAnswerText'))
    );
  }

  addAnswerChoice(answerChoice: AnswerChoice): Observable<AnswerChoice> {
    // Dummy method copied from addAnswerText.
    // Todo: Implement correct method with api
    return this.http.post<AnswerChoice>(this.textAnswerUrl, answerChoice, httpOptions).pipe(
      catchError(this.handleError<AnswerChoice>('addAnswerText'))
    );
  }

  getAnswerText(id: string): Observable<AnswerText> {
    const url = `${this.textAnswerUrl}/${id}`;
    return this.http.get<AnswerText>(url).pipe(
      catchError(this.handleError<AnswerText>(`getAnswerText id=${id}`))
    );
  }
}
