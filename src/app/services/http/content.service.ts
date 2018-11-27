import { Injectable } from '@angular/core';
import { Content } from '../../models/content';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';

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

  getContentsByIds(ids: string[]): Observable<Content[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/?ids=' + ids;
    return this.http.get<Content[]>(connectionUrl).pipe(
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

  deleteContent(contentId: string): Observable<Content> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/' + contentId;
    return this.http.delete<Content>(connectionUrl, httpOptions).pipe(
      tap (_ => ''),
      catchError(this.handleError<Content>('deleteContent'))
    );
  }
}
