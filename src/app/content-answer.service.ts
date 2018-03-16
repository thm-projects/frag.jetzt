import { Injectable } from '@angular/core';
import { AnswerText } from './answer-text';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, tap } from 'rxjs/operators';
import { ErrorHandlingService } from './error-handling.service';
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class ContentAnswerService extends ErrorHandlingService {
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

  getAnswerText(id: string): Observable<AnswerText> {
    const url = `${this.textAnswerUrl}/${id}`;
    return this.http.get<AnswerText>(url).pipe(
      catchError(this.handleError<AnswerText>(`getAnswerText id=${id}`))
    );
  }
}
