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
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.commentChange + '/' + id;
    return this.http.get<CommentChange>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<CommentChange>('getCommentChangeById')),
    );
  }

  createCommentSubscription(
    commentId: string,
  ): Observable<CommentChangeSubscription> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.commentChange +
      this.apiUrl.commentSubscribe +
      '/' +
      commentId;
    return this.http
      .post<CommentChangeSubscription>(connectionUrl, null, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(
          this.handleError<CommentChangeSubscription>(
            'createCommentSubscription',
          ),
        ),
      );
  }

  deleteCommentSubscription(commentId: string): Observable<void> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.commentChange +
      this.apiUrl.commentSubscribe +
      '/' +
      commentId;
    return this.http.delete<void>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteCommentSubscription')),
    );
  }

  getCommentSubscriptions(): Observable<CommentChangeSubscription[]> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.commentChange +
      this.apiUrl.commentSubscribe;
    return this.http
      .get<CommentChangeSubscription[]>(connectionUrl, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(
          this.handleError<CommentChangeSubscription[]>(
            'getCommentSubscriptions',
          ),
        ),
      );
  }

  createRoomSubscription(
    roomId: string,
  ): Observable<RoomCommentChangeSubscription> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.commentChange +
      this.apiUrl.roomSubscribe +
      '/' +
      roomId;
    return this.http
      .post<RoomCommentChangeSubscription>(connectionUrl, null, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(
          this.handleError<RoomCommentChangeSubscription>(
            'createRoomSubscription',
          ),
        ),
      );
  }

  deleteRoomSubscription(roomId: string): Observable<void> {
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.commentChange +
      this.apiUrl.roomSubscribe +
      '/' +
      roomId;
    return this.http.delete<void>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteRoomSubscription')),
    );
  }

  getRoomSubscriptions(): Observable<RoomCommentChangeSubscription[]> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.commentChange + this.apiUrl.roomSubscribe;
    return this.http
      .get<RoomCommentChangeSubscription[]>(connectionUrl, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(
          this.handleError<RoomCommentChangeSubscription[]>(
            'getRoomSubscriptions',
          ),
        ),
      );
  }
}
