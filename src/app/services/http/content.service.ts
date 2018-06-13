import { Injectable } from '@angular/core';
import { Content } from '../../models/content';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
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
      properties: { type: 'Content' },
      externalFilters: { roomId: roomId }
    }, httpOptions).pipe(
      catchError(this.handleError('getContents', []))
    );
  }

  addContent(content: Content): Observable<Content> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/';
    return this.http.post<Content>(connectionUrl,
      { roomId: content.roomId, subject: content.subject, body: content.body,
        type: 'Content', format: content.format, group: 'preparation' },
      httpOptions).pipe(
      catchError(this.handleError<Content>('addContent'))
    );
  }

  addContentChoice(contentChoice: ContentChoice): Observable<ContentChoice> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/';
    return this.http.post<ContentChoice>(connectionUrl,
      { roomId: contentChoice.roomId, subject: contentChoice.subject, body: contentChoice.body,
        type: 'ChoiceContent', format: contentChoice.format, group: 'preparation' },
      httpOptions).pipe(
      catchError(this.handleError<ContentChoice>('addContent'))
    );
  }

  updateContent(updatedContent: Content): Observable<Content> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/' + updatedContent.contentId;
    return this.http.put(connectionUrl, updatedContent, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('updateContent'))
    );
  }

  deleteContent(contentId: string): Observable<Content> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/' + contentId;
    return this.http.delete<Content>(connectionUrl, httpOptions).pipe(
      tap (_ => ''),
      catchError(this.handleError<Content>('deleteContent'))
    );
  }
}
