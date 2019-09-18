import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseHttpService } from './base-http.service';
import { User } from '../../models/user';
import { catchError, tap } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({})
};

@Injectable()
export class UserService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    user: '/user',
    activate: '/activate',
    resetActivation: '/resetactivation',
    find: '/find'
  };

  constructor(private http: HttpClient) {
    super();
  }

  activate(name: string, activationKey: string): Observable<string> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + '/~' + encodeURIComponent(name) +
      this.apiUrl.activate + '?key=' + activationKey;

    return this.http.post<string>(connectionUrl, {
      }, httpOptions);
  }

  resetActivation(username: string): Observable<User> {
    const connectionUrl: string = this.apiUrl.base +
        this.apiUrl.user +
        '/~' + encodeURIComponent(username) +
        this.apiUrl.resetActivation;
    return this.http.post<any>(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<User>('resetActivation'))
    );
  }

  delete(id: string): Observable<User> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + '/' + id;
    return this.http.delete<User>(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<User>('deleteUser'))
    );
  }

  getIdByLoginId(loginId: string): Observable<User[]> {
    const url = `${this.apiUrl.base + this.apiUrl.user + this.apiUrl.find}`;
    return this.http.post<User[]>(url, {
      properties: { loginId: loginId },
      externalFilters: {}
    }).pipe(
      tap(() => ''),
      catchError(this.handleError('getUserId', []))
    );
  }
}
