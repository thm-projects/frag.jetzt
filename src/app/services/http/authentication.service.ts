import { catchError, map, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { Observable, of } from 'rxjs';
import { UserRole } from '../../models/user-roles.enum';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClientAuthentication } from '../../models/client-authentication';
import { BaseHttpService } from './base-http.service';

export enum LoginResult {
  Success,
  Failure,
  FailureActivation,
  FailurePasswordReset,
  FailureException,
  SessionExpired,
}

export type LoginResultArray = [LoginResult, User];

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    v2: '/api/v2',
    auth: '/auth',
    login: '/login',
    user: '/user',
    register: '/register',
    registered: '/registered',
    resetPassword: '/resetpassword',
    guest: '/guest',
    superAdmin: '/super-admin'
  };

  private readonly httpOptions = {
    headers: new HttpHeaders({})
  };

  constructor(
    private http: HttpClient,
  ) {
    super();
  }

  refreshLoginWithToken(token: string): Observable<LoginResultArray> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + '?refresh=true';
    return this.checkLogin(
      this.http.post<ClientAuthentication>(connectionUrl, {}, this.getTokenHeader(token)),
      UserRole.PARTICIPANT,
    );
  }

  loginAsGuest(): Observable<LoginResultArray> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + this.apiUrl.guest;
    return this.checkLogin(
      this.http.post<ClientAuthentication>(connectionUrl, null, this.httpOptions),
      UserRole.PARTICIPANT,
    );
  }

  login(email: string, password: string): Observable<LoginResultArray> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + this.apiUrl.registered;
    return this.checkLogin(
      this.http.post<ClientAuthentication>(connectionUrl, { loginId: email, password }, this.httpOptions),
      UserRole.PARTICIPANT,
    );
  }

  register(email: string, password: string): Observable<boolean> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + this.apiUrl.register;
    return this.http.post<boolean>(connectionUrl, { loginId: email, password }, this.httpOptions).pipe(
      tap(_ => ''),
      map(() => true)
    );
  }

  resetPassword(email: string): Observable<string> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + '/' + email + this.apiUrl.resetPassword;
    return this.http.post(connectionUrl, { key: null, password: null }, this.httpOptions).pipe(
      tap(_ => ''),
      catchError(err => of(err.error.message))
    );
  }

  setNewPassword(email: string, key: string, password: string): Observable<string> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + '/' + email + this.apiUrl.resetPassword;
    return this.http.post(connectionUrl, { key, password }, this.httpOptions).pipe(
      tap(_ => ''),
      catchError(err => of(err.error.message))
    );
  }

  checkSuperAdmin(token: string): Observable<boolean> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + this.apiUrl.superAdmin;
    return this.http.get(connectionUrl, this.getTokenHeader(token)).pipe(
      tap(_ => ''),
      catchError(err => of(err.error?.message || err))
    );
  }

  private checkLogin(clientAuthentication: Observable<ClientAuthentication>,
                     userRole: UserRole): Observable<LoginResultArray> {
    return clientAuthentication.pipe(
      map((result) => {
        if (!result) {
          return [LoginResult.Failure, null] as LoginResultArray;
        }
        return [
          LoginResult.Success,
          new User(result.credentials, result.name, result.type, result.details, userRole, result.type === 'guest')
        ] as LoginResultArray;
      }),
      catchError((e) => {
        // check if user needs activation
        if (e.status === 401 && e.statusText === 'Unauthorized') {
          return of([LoginResult.SessionExpired, null] as LoginResultArray);
        } else if (e.error?.status === 403) {
          if (e.error?.message === 'Activation in process') {
            return of([LoginResult.FailureActivation, null] as LoginResultArray);
          } else if (e.error?.message === 'Password reset in process') {
            return of([LoginResult.FailurePasswordReset, null] as LoginResultArray);
          }
        }
        console.error(e);
        return of([LoginResult.FailureException, null] as LoginResultArray);
      }));
  }

  private getTokenHeader(token: string) {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }
}
