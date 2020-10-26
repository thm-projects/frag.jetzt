import { Injectable } from '@angular/core';
import { Vote } from '../../models/vote';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { BaseHttpService } from './base-http.service';

const httpOptions = {
  headers: new HttpHeaders({})
};

@Injectable()
export class VoteService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    vote: '/vote',
    find: '/find'
  };

  constructor(private http: HttpClient,
              private authService: AuthenticationService) {
    super();
  }

  getByRoomIdAndUserID(roomId: string, userId: string): Observable<Vote[]> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.vote + this.apiUrl.find}`;
    return this.http.post<Vote[]>(connectionUrl, {
      properties: {
        accountId: userId
      },
      externalFilters: {
        roomId: roomId
      }
    }).pipe(
      tap(() => ''),
      catchError(this.handleError<Vote[]>(`get votes by roomid = ${roomId}`))
    );
  }
}
