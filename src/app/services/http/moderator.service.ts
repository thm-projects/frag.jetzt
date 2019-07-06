import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Moderator } from '../../models/moderator';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class ModeratorService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    room: '/room',
    moderator: '/moderator',
    find: '/find'
  };

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
}
