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
    activate: '/activate'
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

  delete(id: string): Observable<User> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + '/' + id;
    return this.http.delete<User>(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<User>('deleteUser'))
    );
  }
}
