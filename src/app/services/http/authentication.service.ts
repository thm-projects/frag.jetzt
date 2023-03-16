import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { Observable, of, throwError } from 'rxjs';
import { UserRole } from '../../models/user-roles.enum';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClientAuthentication } from '../../models/client-authentication';
import { BaseHttpService } from './base-http.service';
import { UUID } from 'app/utils/ts-utils';

export enum LoginResult {
  Success,
  Failure,
  FailureActivation,
  FailurePasswordReset,
  FailurePasswordExpired,
  FailureException,
  SessionExpired,
  NewPasswordIsOldPassword,
  PasswordTooCommon,
  InvalidKey,
  KeyExpired,
}

const ERROR_TABLE = {
  'Activation in process': LoginResult.FailureActivation,
  'Password reset in process': LoginResult.FailurePasswordReset,
  'Password expired': LoginResult.FailurePasswordExpired,
  'Key expired': LoginResult.KeyExpired,
  'Invalid Key': LoginResult.InvalidKey,
  'New password is old password': LoginResult.NewPasswordIsOldPassword,
} as const;

export type LoginResultArray = [LoginResult, User];

export interface FoundRange {
  start: number;
  end: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    v2: '/api/v2',
    auth: '/auth',
    login: '/login',
    passwordDictionary: '/password-dictionary',
    user: '/user',
    register: '/register',
    registered: '/registered',
    resetPassword: '/resetpassword',
    guest: '/guest',
    superAdmin: '/super-admin',
  };

  private readonly httpOptions = {
    headers: new HttpHeaders({}),
  };

  constructor(private http: HttpClient) {
    super();
  }

  checkPasswordInDictionary(password: string): Observable<FoundRange[]> {
    const connectionUrl: string =
      this.apiUrl.base +
      this.apiUrl.auth +
      this.apiUrl.passwordDictionary +
      '/' +
      encodeURIComponent(password);
    return this.http
      .post<FoundRange[]>(connectionUrl, null, this.httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<FoundRange[]>('checkPasswordInDictionary')),
      );
  }

  refreshLoginWithToken(token: string): Observable<LoginResultArray> {
    const connectionUrl: string =
      this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + '?refresh=true';
    return this.checkLogin(
      this.http.post<ClientAuthentication>(
        connectionUrl,
        {},
        this.getTokenHeader(token),
      ),
      UserRole.PARTICIPANT,
    );
  }

  loginAsGuest(): Observable<LoginResultArray> {
    const connectionUrl: string =
      this.apiUrl.base +
      this.apiUrl.auth +
      this.apiUrl.login +
      this.apiUrl.guest;
    return this.checkLogin(
      this.http.post<ClientAuthentication>(
        connectionUrl,
        null,
        this.httpOptions,
      ),
      UserRole.PARTICIPANT,
    );
  }

  login(email: string, password: string): Observable<LoginResultArray> {
    const connectionUrl: string =
      this.apiUrl.base +
      this.apiUrl.auth +
      this.apiUrl.login +
      this.apiUrl.registered;
    return this.checkLogin(
      this.http.post<ClientAuthentication>(
        connectionUrl,
        { loginId: email, password },
        this.httpOptions,
      ),
      UserRole.PARTICIPANT,
    );
  }

  register(email: string, password: string): Observable<LoginResult> {
    const connectionUrl: string =
      this.apiUrl.base + this.apiUrl.user + this.apiUrl.register;

    return this.checkCompromised(password).pipe(
      map((compromisedLength) => password.length - compromisedLength >= 6),
      tap((_) => ''),
      switchMap((isPasswordUncommonEnough: boolean) => {
        if (!isPasswordUncommonEnough) {
          return throwError(() => LoginResult.PasswordTooCommon);
        }
        return this.http.post<boolean>(
          connectionUrl,
          { loginId: email, password },
          this.httpOptions,
        );
      }),
      map(() => LoginResult.Success),
      catchError((err) => {
        const msg = err.error?.message;
        const errVal = ERROR_TABLE[msg];
        if (errVal) {
          return throwError(() => errVal);
        }
        return throwError(() => msg);
      }),
    );
  }

  resetPassword(email: string): Observable<string> {
    const connectionUrl: string =
      this.apiUrl.base +
      this.apiUrl.user +
      '/' +
      email +
      this.apiUrl.resetPassword;
    return this.http
      .post(connectionUrl, { key: null, password: null }, this.httpOptions)
      .pipe(
        tap((_) => ''),
        catchError((err) => of(err.error.message)),
      );
  }

  checkCompromised(password: string) {
    return this.checkPasswordInDictionary(password).pipe(
      map((arr: FoundRange[]) =>
        arr.reduce(
          (acc: number, range: FoundRange) => acc + range.end - range.start,
          0,
        ),
      ),
    );
  }

  setNewPassword(
    email: string,
    key: string,
    password: string,
  ): Observable<string> {
    const connectionUrl: string =
      this.apiUrl.base +
      this.apiUrl.user +
      '/' +
      email +
      this.apiUrl.resetPassword;

    return this.checkCompromised(password).pipe(
      map((compromisedLength) => password.length - compromisedLength >= 6),
      tap(() => ''),
      switchMap((isPasswordUncommonEnough: boolean) => {
        if (!isPasswordUncommonEnough) {
          return throwError(() => LoginResult.PasswordTooCommon);
        }
        return this.http
          .post<string>(connectionUrl, { key, password }, this.httpOptions)
          .pipe(
            tap((_) => ''),
            catchError((err) => {
              const msg = err.error.message;
              const errVal = ERROR_TABLE[msg];
              if (errVal) {
                return throwError(() => errVal);
              }
              return throwError(() => msg);
            }),
          );
      }),
    );
  }

  checkSuperAdmin(token: string): Observable<boolean> {
    const connectionUrl: string =
      this.apiUrl.base + this.apiUrl.user + this.apiUrl.superAdmin;
    return this.http.get(connectionUrl, this.getTokenHeader(token)).pipe(
      tap((_) => ''),
      catchError((err) => of(err.error?.message || err)),
    );
  }

  private checkLogin(
    clientAuthentication: Observable<ClientAuthentication>,
    userRole: UserRole,
  ): Observable<LoginResultArray> {
    return clientAuthentication.pipe(
      map((result) => {
        if (!result) {
          return [LoginResult.Failure, null] as LoginResultArray;
        }
        return [
          LoginResult.Success,
          new User({
            id: result.credentials as UUID,
            loginId: result.name,
            type: result.type,
            token: result.details,
            role: userRole,
            isGuest: result.type === 'guest',
          }),
        ] as LoginResultArray;
      }),
      catchError((e) => {
        // check if user needs activation
        console.log(e.status, e.error?.message, e);
        return this.catchErrors(e);
      }),
    );
  }

  private catchErrors(e: any): Observable<LoginResultArray> {
    if (e.status === 401 && e.statusText === 'Unauthorized') {
      return of([LoginResult.SessionExpired, null] as LoginResultArray);
    }
    const msg = e.error?.message;
    const err = ERROR_TABLE[msg];
    if (!err) {
      return of([err, null] as LoginResultArray);
    }
    console.error(e);
    return of([LoginResult.FailureException, null] as LoginResultArray);
  }

  private getTokenHeader(token: string) {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
      }),
    };
  }
}
