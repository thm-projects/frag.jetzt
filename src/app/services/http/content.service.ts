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
    base: 'https://arsnova-staging.mni.thm.de/api',
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

  updateContent(updatedContent: Content): Observable<Content> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/' + updatedContent.contentId;
    return this.http.put(connectionUrl, updatedContent, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('updateContent'))
    );
  }

  deleteContent(content: Content): Observable<Content> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.content + '/' + content.contentId;
    return this.http.delete<Content>(connectionUrl, httpOptions).pipe(
      tap (_ => ''),
      catchError(this.handleError<Content>('deleteContent'))
    );
  }

  updateContent(content: Content) {
    // ToDo: implement service, api call
    console.log('Content updated.');
  }

  deleteContent(contentId: string) {
    // ToDo: implement service, api call
    console.log('Content deleted.');
  }
}
