import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Moderator } from '../../models/moderator';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { User } from '../../models/user';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class ModeratorService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    room: '/room',
    moderator: '/moderator',
    user: '/user',
    find: '/find'
  };
  private joinDate: Date;

  constructor(private http: HttpClient) {
    super();
  }

  get(roomId: string): Observable<Moderator[]> {
    const url = `${this.apiUrl.base + this.apiUrl.room}/${roomId + this.apiUrl.moderator}`;
    return this.http.get(url, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('getModerator'))
    );
  }

  add(roomId: string, userId: string) {
    const url = `${this.apiUrl.base + this.apiUrl.room}/${roomId + this.apiUrl.moderator}/${userId}`;
    return this.http.put(url, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('addModerator'))
    );
  }

  delete(roomId: string, userId: string) {
    const url = `${this.apiUrl.base + this.apiUrl.room}/${roomId + this.apiUrl.moderator}/${userId}`;
    return this.http.delete(url, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('deleteModerator'))
    );
  }

  getUserId(loginId: string): Observable<User[]> {
    const url = `${this.apiUrl.base + this.apiUrl.user + this.apiUrl.find}`;
    return this.http.post<User[]>(url, {
      properties: { loginId: loginId },
      externalFilters: {}
    }).pipe(
      tap(() => ''),
      catchError(this.handleError('getUserId', []))
    );
  }

  getUserData(userIds: string[]): Observable<User[]> {
    const url = `${this.apiUrl.base + this.apiUrl.user}/?ids=${userIds}`;
    return this.http.get<User[]>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError('getUserData', []))
    );
  }

  addToHistory(roomId: string, userId: string): void {
    this.joinDate = new Date(Date.now());
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.user }/${ userId }/roomHistory`;
    this.http.post(connectionUrl, { roomId: roomId, lastVisit: this.joinDate.getTime() }, httpOptions).subscribe(() => {});
  }
}
