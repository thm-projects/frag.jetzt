import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CommentChange } from '../../models/comment-change';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class CommentChangeService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    commentChange: '/comment-change',
    find: '/find',
    commentSubscribe: '/comment-subscribe',
    roomSubscribe: '/room-subscribe',
  };

  constructor(private http: HttpClient) {
    super();
  }

  findAllChangesSince(date: Date): Observable<CommentChange[]> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.commentChange + this.apiUrl.find;
    return this.http
      .post<CommentChange[]>(
        connectionUrl,
        {
          properties: {},
          externalFilters: {
            lastAction: date.getTime(),
          },
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        catchError(this.handleError<CommentChange[]>('findAllChangesSince')),
      );
  }

  getCommentChangeById(id: string): Observable<CommentChange> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.commentChange + '/' + id;
    return this.http.get<CommentChange>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<CommentChange>('getCommentChangeById')),
    );
  }
}
