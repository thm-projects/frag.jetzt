import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BrainstormingSession } from '../../models/brainstorming-session';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface BrainstormingVote {
  id: string;
  accountId: string;
  wordId: string;
  isUpvote: boolean;
}

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class BrainstormingService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    brainstorming: '/brainstorming',
    close: '/close',
    upvote: '/upvote',
    downvote: '/downvote',
    vote: '/vote'
  };

  constructor(private http: HttpClient) {
    super();
  }

  createSession(session: Partial<BrainstormingSession>): Observable<BrainstormingSession> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.brainstorming + '/';
    return this.http.post<BrainstormingSession>(connectionUrl, session, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<BrainstormingSession>('createSession'))
    );
  }

  closeSession(sessionId: string): Observable<BrainstormingSession> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.brainstorming + '/' + sessionId + this.apiUrl.close;
    return this.http.post<BrainstormingSession>(connectionUrl, null, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<BrainstormingSession>('closeSession'))
    );
  }

  deleteSession(sessionId: string): Observable<any> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.brainstorming + '/' + sessionId;
    return this.http.delete(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError('deleteSession'))
    );
  }

  createVote(sessionId: string, word: string, upvote: boolean): Observable<BrainstormingVote> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.brainstorming + '/' +
      sessionId + (upvote ? this.apiUrl.upvote : this.apiUrl.downvote);
    return this.http.post<BrainstormingVote>(connectionUrl, word, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<BrainstormingVote>('createVote'))
    );
  }

  deleteVote(sessionId: string, word: string): Observable<any> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.brainstorming + '/' + sessionId + this.apiUrl.vote + '/' +
      encodeURIComponent(word);
    return this.http.delete(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError('deleteVote'))
    );
  }
}
