import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseHttpService } from './base-http.service';
import { User } from '../../models/user';
import { catchError, tap } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({}),
};

@Injectable({
  providedIn: 'root',
})
export class UserService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    user: '/user',
    find: '/find',
  };

  constructor(private http: HttpClient) {
    super();
  }

  delete(id: string): Observable<User> {
    const connectionUrl: string =
      this.apiUrl.base + this.apiUrl.user + '/' + id;
    return this.http.delete<User>(connectionUrl, httpOptions).pipe(
      tap((_) => ''),
      catchError(this.handleError<User>('deleteUser')),
    );
  }

  getIdByLoginId(loginId: string): Observable<User[]> {
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
}
