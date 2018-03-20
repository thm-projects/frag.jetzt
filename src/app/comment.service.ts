import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Comment } from './models/comment';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class CommentService extends BaseHttpService {
  private commentsUrl = 'api/comments';

  constructor( private http: HttpClient ) {
    super();
  }

  addComment(comment: Comment): Observable<Comment> {
    return this.http.post<Comment>(this.commentsUrl, comment, httpOptions).pipe(
      tap (_ => ''),
      catchError(this.handleError<Comment>('addComment'))
    );
  }

  deleteComment(comment: Comment): Observable<Comment> {
    const url = `${this.commentsUrl}/${comment.id}`;
    return this.http.delete<Comment>(url, httpOptions).pipe(
      tap (_ => ''),
      catchError(this.handleError<Comment>('deleteComment'))
    );
  }

  getComments(roomId: string): Observable<Comment[]> {
    const url = `${this.commentsUrl}/?roomId=${roomId}`;
    return this.http.get<Comment[]>(url).pipe(
      tap (_ => ''),
      catchError(this.handleError<Comment[]>('getComments', []))
    );
  }

  searchComments(roomId: string, userId: string): Observable<Comment[]> {
    const url = `${this.commentsUrl}/?roomId=${roomId}&userId=${userId}`;
    return this.http.get<Comment[]>(url).pipe(
      tap (_ => ''),
      catchError(this.handleError<Comment[]>('getComments', []))
    );
  }

  updateComment(comment: Comment): Observable<any> {
    return this.http.put(this.commentsUrl, comment, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('updateComment'))
    );
  }
}
