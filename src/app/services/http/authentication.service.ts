import { Injectable } from '@angular/core';
import { Observable, catchError, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClientAuthentication } from '../../models/client-authentication';
import { BaseHttpService } from './base-http.service';
import { UUID } from 'app/utils/ts-utils';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    v2: '/api/v2',
    auth: '/auth',
    login: '/login',
    user: '/user',
    registered: '/registered',
    guest: '/guest',
  };

  private readonly httpOptions = {
    headers: new HttpHeaders({}),
  };

  constructor(private http: HttpClient) {
    super();
  }

  refreshLoginWithToken(token: string): Observable<ClientAuthentication> {
    const connectionUrl: string =
      this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + '?refresh=true';
    return this.http
      .post<ClientAuthentication>(connectionUrl, {}, this.getTokenHeader(token))
      .pipe(
        tap(() => ''),
        catchError(
          this.handleError<ClientAuthentication>('refreshLoginWithToken'),
        ),
      );
  }

  loginAsGuest(): Observable<ClientAuthentication> {
    const connectionUrl: string =
      this.apiUrl.base +
      this.apiUrl.auth +
      this.apiUrl.login +
      this.apiUrl.guest;
    return this.http
      .post<ClientAuthentication>(connectionUrl, null, this.httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<ClientAuthentication>('loginAsGuest')),
      );
  }

  login(token: string, keycloakId: UUID): Observable<ClientAuthentication> {
    const connectionUrl: string =
      this.apiUrl.base +
      this.apiUrl.auth +
      this.apiUrl.login +
      this.apiUrl.registered +
      '/' +
      keycloakId;
    return this.http
      .post<ClientAuthentication>(connectionUrl, token, this.httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<ClientAuthentication>('login')),
      );
  }

  private getTokenHeader(token: string) {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }
}
