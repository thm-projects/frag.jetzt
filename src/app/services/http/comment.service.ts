import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Comment } from '../../models/comment';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class CommentService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    comment: '/comment',
    find: '/find'
  };

  exportButton = new Subject<boolean>();

  constructor(private http: HttpClient) {
    super();
  }

  getComment(commentId: string): Observable<Comment> {
    const connectionUrl = `${this.apiUrl.base}${this.apiUrl.comment}/~${commentId}`;
    return this.http.get<Comment>(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Comment>('addComment'))
    );
  }

  addComment(comment: Comment): Observable<Comment> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + '/';
    return this.http.post<Comment>(connectionUrl,
      {
        roomId: comment.roomId, body: comment.body,
        read: comment.read, creationTimestamp: comment.creationTimestamp
      }, httpOptions).pipe(
        tap(_ => ''),
        catchError(this.handleError<Comment>('addComment'))
      );
  }

  deleteComment(commentId: string): Observable<Comment> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.comment}/${commentId}`;
    return this.http.delete<Comment>(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Comment>('deleteComment'))
    );
  }

  getComments(roomId: string): Observable<Comment[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + this.apiUrl.find;
    return this.http.post<Comment[]>(connectionUrl, {
      properties: { roomId: roomId },
      externalFilters: {}
    }, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Comment[]>('getComments', []))
    );
  }

  updateComment(comment: Comment): Observable<any> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.comment + '/' + comment.id;
    return this.http.put(connectionUrl, comment, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('updateComment'))
    );
  }

  setState(state: boolean) {
    this.exportButton.next(state);
  }
}
