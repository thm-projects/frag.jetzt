import { Injectable } from '@angular/core';
import { Vote } from '../../models/vote';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { Comment } from 'app/models/comment';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable()
export class VoteService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    vote: '/vote',
    find: '/find',
  };

  constructor(private http: HttpClient) {
    super();
  }

  getByRoomIdAndUserID(roomId: string, userId: string): Observable<Vote[]> {
    const connectionUrl = `${
      this.apiUrl.base + this.apiUrl.vote + this.apiUrl.find
    }`;
    return this.http
      .post<Vote[]>(connectionUrl, {
        properties: {
          accountId: userId,
        },
        externalFilters: {
          roomId,
        },
      })
      .pipe(
        tap(() => ''),
        catchError(this.handleError<Vote[]>(`get votes by roomid = ${roomId}`)),
      );
  }

  voteUp(comment: Comment, userId: string): Observable<Vote> {
    const vote = { accountId: userId, commentId: comment.id, vote: 1 };
    const connectionUrl = this.apiUrl.base + this.apiUrl.vote + '/';
    return this.http.post<Vote>(connectionUrl, vote, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Vote>('voteUp')),
    );
  }

  voteDown(comment: Comment, userId: string): Observable<Vote> {
    const vote = { accountId: userId, commentId: comment.id, vote: -1 };
    const connectionUrl = this.apiUrl.base + this.apiUrl.vote + '/';
    return this.http.post<Vote>(connectionUrl, vote, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Vote>('voteUp')),
    );
  }

  resetVote(comment: Comment, userId: string): Observable<Vote> {
    const vote = { accountId: userId, commentId: comment.id, vote: 0 };
    const connectionUrl = this.apiUrl.base + this.apiUrl.vote + '/';
    return this.http.post<Vote>(connectionUrl, vote, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Vote>('voteUp')),
    );
  }
}
