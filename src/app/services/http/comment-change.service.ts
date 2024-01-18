import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CommentChange } from '../../models/comment-change';

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
        tap((_) => ''),
        catchError(this.handleError<CommentChange[]>('findAllChangesSince')),
      );
  }

  getCommentChangeById(id: string): Observable<CommentChange> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.commentChange + '/' + id;
    return this.http.get<CommentChange>(connectionUrl, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<CommentChange>('getCommentChangeById')),
    );
  }
}
