import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BonusToken } from '../../models/bonus-token';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable()
export class BonusTokenService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    bonustoken: '/bonustoken',
    delete: '/delete',
    deleteByRoom: '/deletebyroom',
    find: '/find',
  };

  constructor(private http: HttpClient) {
    super();
  }

  getTokensByRoomId(roomId: string): Observable<BonusToken[]> {
    const connectionUrl = `${
      this.apiUrl.base + this.apiUrl.bonustoken + this.apiUrl.find
    }`;
    return this.http
      .post<BonusToken[]>(connectionUrl, {
        properties: {
          roomId,
        },
      })
      .pipe(
        tap(() => ''),
        catchError(
          this.handleError<BonusToken[]>(
            `get bonus token by roomid = ${roomId}`,
          ),
        ),
      );
  }

  getTokensByUserId(userId: string): Observable<BonusToken[]> {
    const connectionUrl = `${
      this.apiUrl.base + this.apiUrl.bonustoken + this.apiUrl.find
    }`;
    return this.http
      .post<BonusToken[]>(connectionUrl, {
        properties: {
          accountId: userId,
        },
      })
      .pipe(
        tap(() => ''),
        catchError(
          this.handleError<BonusToken[]>(
            `get bonus token by userId = ${userId}`,
          ),
        ),
      );
  }

  deleteToken(commentId: string, userId: string) {
    const connectionUrl =
      `${this.apiUrl.base + this.apiUrl.bonustoken + this.apiUrl.delete}` +
      `?&commentid=${commentId}&userid=${userId}`;
    return this.http.delete<BonusToken>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<BonusToken>('deleteToken')),
    );
  }

  deleteTokensByRoomId(roomId: string) {
    const connectionUrl = `${
      this.apiUrl.base + this.apiUrl.bonustoken + this.apiUrl.deleteByRoom
    }?roomid=${roomId}`;
    return this.http.delete<BonusToken>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<BonusToken>('deleteToken')),
    );
  }
}
