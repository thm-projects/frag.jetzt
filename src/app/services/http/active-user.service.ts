import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Room } from '../../models/room';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LivepollSession } from 'app/models/livepoll-session';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

export interface GlobalCount {
  sessionCount: number;
  activeRoomCount: number;
  participantCount: number;
  moderatorCount: number;
  creatorCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class ActiveUserService extends BaseHttpService {
  constructor(private http: HttpClient) {
    super();
  }

  public getActiveUser(room: Room): Observable<number[]> {
    const url = '/gateway-api/roomsubscription/usercount?ids=' + room.id;
    return this.http.get<number[]>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<number[]>('getActiveUser')),
    );
  }

  public getActiveLivepollUser(
    livepoll: LivepollSession,
  ): Observable<number[]> {
    const url =
      '/gateway-api/livepollsubscription/usercount?ids=' + livepoll.id;
    return this.http.get<number[]>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<number[]>('getActiveLivepollUser')),
    );
  }

  public getGlobal(): Observable<GlobalCount> {
    const url = '/gateway-api/stats';
    return this.http.get<GlobalCount>(url, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<GlobalCount>('getGlobal')),
    );
  }
}
