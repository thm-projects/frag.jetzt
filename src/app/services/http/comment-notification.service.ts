import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommentNotification } from '../../models/comment-notification';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root',
})
export class CommentNotificationService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    commentNotification: '/comment-notification',
    find: '/find',
  };

  constructor(private http: HttpClient) {
    super();
  }

  findByRoomId(roomId: string): Observable<CommentNotification[]> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.commentNotification + this.apiUrl.find;
    return this.http
      .post<CommentNotification[]>(connectionUrl, {
        properties: { roomId },
        externalFilters: {},
      })
      .pipe(
        tap(() => ''),
        catchError(this.handleError<CommentNotification[]>('findByRoomId')),
      );
  }

  getById(id: string): Observable<CommentNotification> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.commentNotification + '/' + id;
    return this.http.get<CommentNotification>(connectionUrl).pipe(
      tap(() => ''),
      catchError(this.handleError<CommentNotification>('getById')),
    );
  }

  createNotification(
    roomId: string,
    notificationSetting: number,
  ): Observable<CommentNotification> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.commentNotification + '/';
    return this.http
      .post<CommentNotification>(connectionUrl, { roomId, notificationSetting })
      .pipe(
        tap(() => ''),
        catchError(this.handleError<CommentNotification>('createNotification')),
      );
  }

  deleteNotification(id: string): Observable<unknown> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.commentNotification + '/' + id;
    return this.http.delete(connectionUrl).pipe(
      tap(() => ''),
      catchError(this.handleError<CommentNotification>('deleteNotification')),
    );
  }
}
