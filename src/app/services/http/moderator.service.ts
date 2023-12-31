import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Moderator } from '../../models/moderator';
import { catchError, map, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { User } from '../../models/user';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable()
export class ModeratorService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    room: '/room',
    moderator: '/moderator',
    moderatorCode: '/moderator-code',
    recreateCode: '/moderator-refresh',
    user: '/user',
    find: '/find',
  };
  private joinDate: Date;

  constructor(private http: HttpClient) {
    super();
  }

  get(roomId: string): Observable<Moderator[]> {
    const url = `${this.apiUrl.base + this.apiUrl.room}/${
      roomId + this.apiUrl.moderator
    }`;
    return this.http.get<Moderator[]>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Moderator[]>('getModerator')),
    );
  }

  add(roomId: string, userId: string) {
    const url = `${this.apiUrl.base + this.apiUrl.room}/${
      roomId + this.apiUrl.moderator
    }/${userId}`;
    return this.http.put(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<object>('addModerator')),
    );
  }

  getModeratorRoomCode(parentRoomId: string): Observable<string> {
    const url = `${this.apiUrl.base + this.apiUrl.room}/${
      parentRoomId + this.apiUrl.moderatorCode
    }`;
    return this.http.get(url, httpOptions).pipe(
      tap(() => ''),
      map((obj) => obj['accessCode']),
      catchError(this.handleError<string>('getModeratorRoomCode')),
    );
  }

  addByRoomCode(moderatorRoomId: string) {
    const url = `${this.apiUrl.base + this.apiUrl.room}/${
      moderatorRoomId + this.apiUrl.moderatorCode
    }/`;
    return this.http.post(url, null, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<object>('addByRoomCode')),
    );
  }

  refreshRoomCode(roomId: string): Observable<string> {
    const url = `${this.apiUrl.base + this.apiUrl.room}/${
      roomId + this.apiUrl.recreateCode
    }`;
    return this.http.put(url, null, httpOptions).pipe(
      tap(() => ''),
      map((obj) => obj['accessCode']),
      catchError(this.handleError<string>('refreshRoomCode')),
    );
  }

  delete(roomId: string, accountId: string) {
    const url = `${this.apiUrl.base + this.apiUrl.room}/${
      roomId + this.apiUrl.moderator
    }/${accountId}`;
    return this.http.delete(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<string>('deleteModerator')),
    );
  }

  getUserId(loginId: string): Observable<User[]> {
    const url = `${this.apiUrl.base + this.apiUrl.user + this.apiUrl.find}`;
    return this.http
      .post<User[]>(url, {
        properties: { email: loginId },
        externalFilters: {},
      })
      .pipe(
        tap(() => ''),
        catchError(this.handleError('getUserId', [])),
      );
  }

  getUserData(userIds: string[]): Observable<User[]> {
    const url = `${this.apiUrl.base + this.apiUrl.user}/?ids=${userIds}`;
    return this.http.get<User[]>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError('getUserData', [])),
    );
  }
}
