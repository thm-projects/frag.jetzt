import { Injectable } from '@angular/core';
import { Content } from '../../models/content';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { AnswerChoice } from '../../models/answer-choice';
import { AnswerStatistics } from '../../models/answer-statistics';
import { ContentChoice } from '../../models/content-choice';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class ContentService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    content: '/content',
    find: '/find'
  };

  constructor(private http: HttpClient) {
    super();
  }

  getContents(roomId: string): Observable<Content[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + this.apiUrl.find;
    return this.http.post<Content[]>(connectionUrl, {
      properties: { roomId: roomId },
      externalFilters: {}
    }, httpOptions).pipe(
      catchError(this.handleError('getContents', []))
    );
  }

  getChoiceContent(id: string): Observable<ContentChoice> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/' + id;
    return this.http.get<ContentChoice>(connectionUrl).pipe(
      tap(() => ''),
      catchError(this.handleError<ContentChoice>('getRoom by id: ' + id))
    );
  }

  getContentsByIds(ids: string[]): Observable<Content[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/?ids=' + ids;
    return this.http.get<Content[]>(connectionUrl).pipe(
      tap(() => ''),
      catchError(this.handleError('getContentsByIds', []))
    );
  }

  getContentChoiceByIds(ids: string[]): Observable<ContentChoice[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/?ids=' + ids;
    return this.http.get<ContentChoice[]>(connectionUrl).pipe(
      tap(() => ''),
      catchError(this.handleError('getContentsByIds', []))
    );
  }

  addContent(content: Content): Observable<Content> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/';
    return this.http.post<Content>(connectionUrl,
      content,
      httpOptions).pipe(
      catchError(this.handleError<Content>('addContent'))
    );
  }

  updateContent(updatedContent: Content): Observable<Content> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/' + updatedContent.id;
    return this.http.put(connectionUrl, updatedContent, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('updateContent'))
    );
  }

  updateChoiceContent(updatedContent: ContentChoice): Observable<ContentChoice> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/' + updatedContent.id;
    return this.http.put(connectionUrl, updatedContent, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('updateContentChoice'))
    );
  }

  deleteContent(contentId: string): Observable<Content> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/' + contentId;
    return this.http.delete<Content>(connectionUrl, httpOptions).pipe(
      tap (_ => ''),
      catchError(this.handleError<Content>('deleteContent'))
    );
  }

  getAnswer(contentId: string): Observable<AnswerStatistics> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/' + contentId + '/stats';
    return this.http.get<AnswerStatistics>(connectionUrl).pipe(
      tap(() => ''),
      catchError(this.handleError<AnswerStatistics>(`getRoom shortId=${ contentId }`))
    );
  }
}
