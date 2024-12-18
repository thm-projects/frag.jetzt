import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BrainstormingSession } from '../../models/brainstorming-session';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BrainstormingWord } from 'app/models/brainstorming-word';
import { BrainstormingCategory } from 'app/models/brainstorming-category';

export interface BrainstormingVote {
  id: string;
  accountId: string;
  wordId: string;
  isUpvote: boolean;
}

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

type BrainstormingSessionAPI = Pick<
  BrainstormingSession,
  | 'active'
  | 'roomId'
  | 'title'
  | 'maxWordLength'
  | 'maxWordCount'
  | 'language'
  | 'ratingAllowed'
  | 'ideasFrozen'
  | 'ideasTimeDuration'
  | 'ideasEndTimestamp'
>;

@Injectable({
  providedIn: 'root',
})
export class BrainstormingService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    brainstorming: '/brainstorming',
    upvote: '/upvote',
    downvote: '/downvote',
    resetVote: '/reset-vote',
    word: '/word',
    patchWord: '/patch-word',
    category: '/category',
    resetRating: '/reset-rating',
    resetCategorization: '/reset-categorization',
  };

  private brainstormingInProgressSubject = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    super();
  }

  get brainstormingInProgress(): boolean {
    return this.brainstormingInProgressSubject.value;
  }

  getBrainstormingInProgress(initValue: boolean): Observable<boolean> {
    this.brainstormingInProgressSubject.next(initValue);
    return this.brainstormingInProgressSubject.asObservable();
  }

  createSession(
    session: Omit<BrainstormingSessionAPI, 'active'>,
  ): Observable<BrainstormingSession> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.brainstorming + '/';
    return this.http
      .post<BrainstormingSession>(connectionUrl, session, httpOptions)
      .pipe(
        tap(() => {
          console.log('Brainstorming session created');
          this.brainstormingInProgressSubject.next(true);
        }),
        catchError(this.handleError<BrainstormingSession>('createSession')),
      );
  }

  patchSession(
    sessionId: string,
    sessionChanges: Partial<BrainstormingSessionAPI>,
  ) {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.brainstorming + '/' + sessionId;
    return this.http
      .patch<BrainstormingSession>(connectionUrl, sessionChanges, httpOptions)
      .pipe(
        tap((updatedSession) => {
          console.log('Brainstorming session updated');
          this.brainstormingInProgressSubject.next(updatedSession.active);
        }),
        catchError(this.handleError<BrainstormingSession>('patchSession')),
      );
  }

  deleteSession(sessionId: string): Observable<void> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.brainstorming + '/' + sessionId;
    return this.http.delete<void>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteSession')),
    );
  }

  createWord(sessionId: string, word: string): Observable<BrainstormingWord> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.brainstorming +
      '/' +
      sessionId +
      this.apiUrl.word +
      '/' +
      encodeURIComponent(word.toLowerCase()) +
      '/';
    return this.http
      .post<BrainstormingWord>(connectionUrl, { text: word }, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<BrainstormingWord>('createWord')),
      );
  }

  patchWord(
    wordId: string,
    changes: Partial<
      Pick<BrainstormingWord, 'correctedWord' | 'banned' | 'categoryId'>
    >,
  ): Observable<BrainstormingWord> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.brainstorming +
      this.apiUrl.patchWord +
      '/' +
      wordId;
    return this.http
      .patch<BrainstormingWord>(connectionUrl, changes, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<BrainstormingWord>('patchWord')),
      );
  }

  createVote(wordId: string, upvote: boolean): Observable<BrainstormingVote> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.brainstorming +
      '/' +
      wordId +
      (upvote ? this.apiUrl.upvote : this.apiUrl.downvote);
    return this.http
      .post<BrainstormingVote>(connectionUrl, null, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<BrainstormingVote>('createVote')),
      );
  }

  deleteVote(wordId: string): Observable<void> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.brainstorming +
      '/' +
      wordId +
      this.apiUrl.resetVote;
    return this.http.delete<void>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteVote')),
    );
  }

  getCategories(roomId: string): Observable<BrainstormingCategory[]> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.brainstorming +
      this.apiUrl.category +
      '/' +
      roomId;
    return this.http
      .get<BrainstormingCategory[]>(connectionUrl, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<BrainstormingCategory[]>('getCategories')),
      );
  }

  updateCategories(
    roomId: string,
    categories: string[],
  ): Observable<BrainstormingCategory[]> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.brainstorming +
      this.apiUrl.category +
      '/' +
      roomId +
      '/';
    return this.http
      .post<BrainstormingCategory[]>(connectionUrl, categories, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(
          this.handleError<BrainstormingCategory[]>('updateCategories'),
        ),
      );
  }

  deleteAllVotes(sessionId: string): Observable<void> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.brainstorming +
      '/' +
      sessionId +
      this.apiUrl.resetRating;
    return this.http.post<void>(connectionUrl, null, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteAllVotes')),
    );
  }

  deleteAllCategoryAssignments(sessionId: string): Observable<void> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.brainstorming +
      '/' +
      sessionId +
      this.apiUrl.resetCategorization;
    return this.http.post<void>(connectionUrl, null, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteAllCategoryAssignments')),
    );
  }
}
