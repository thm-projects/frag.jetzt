import { catchError, map, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { UserRole } from '../../models/user-roles.enum';
import { DataStoreService } from '../util/data-store.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClientAuthentication } from '../../models/client-authentication';
import { BaseHttpService } from './base-http.service';

export enum LoginResult {
  Success,
  Failure,
  FailureActivation,
  FailurePasswordReset,
  FailureException,
  NoData
}

const STORAGE_KEY = 'USER';
const ROOM_ACCESS = 'ROOM_ACCESS';
const LOGGED_IN = 'loggedin';

@Injectable()
export class AuthenticationService extends BaseHttpService {
  private user = new BehaviorSubject<User>(undefined);
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
  private httpOptions = {
    headers: new HttpHeaders({})
  };

  private roomAccess = new Map();
  private _isSuperAdmin = false;

  constructor(
    private dataStoreService: DataStoreService,
    private http: HttpClient,
  ) {
    super();
    this.loadRoomAccesses();
  }

  get watchUser() {
    return this.user.asObservable();
  }

  get isSuperAdmin() {
    return this._isSuperAdmin;
  }

  login(email: string, password: string, userRole: UserRole): Observable<LoginResult> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + this.apiUrl.registered;
    return this.checkLogin(this.http.post<ClientAuthentication>(connectionUrl,
      { loginId: email, password }, this.httpOptions), userRole).pipe(
      tap(_ => '')
    );
  }

  refreshLogin(): Observable<LoginResult> {
    const data = this.dataStoreService.get(STORAGE_KEY);
    if (!data) {
      return of(LoginResult.NoData);
    }
    const user: User = JSON.parse(data);
    this.setUser(new User(
      user.id,
      user.loginId,
      user.type,
      user.token,
      user.role,
      user.isGuest
    ));
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + '?refresh=true';
    return this.checkLogin(this.http.post<ClientAuthentication>(connectionUrl, {}, this.httpOptions), user.role)
      .pipe(
        tap(result => {
          if (result === LoginResult.FailureException) {
            this.dataStoreService.remove(STORAGE_KEY);
            this.logout();
          } else if (result !== LoginResult.Success) {
            this.logout();
          }
        })
      );
  }

  guestLogin(userRole: UserRole): Observable<LoginResult> {
    const data = this.dataStoreService.get(STORAGE_KEY);
    const wasGuest = !!(data && JSON.parse(data)?.isGuest);
    if (wasGuest) {
      this.refreshLogin().subscribe();
    }
    if (this.isLoggedIn()) {
      return of(LoginResult.Success);
    }
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + this.apiUrl.guest;
    return this.checkLogin(this.http.post<ClientAuthentication>(connectionUrl, null, this.httpOptions), userRole).pipe(
      tap(_ => '')
    );
  }

  register(email: string, password: string): Observable<boolean> {
    if (this.user.getValue()) {
      throw new Error('Already logged in!');
    }
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + this.apiUrl.register;
    return this.http.post<boolean>(connectionUrl, { loginId: email, password }, this.httpOptions).pipe(
      tap(_ => ''),
      map(() => true)
    );
  }

  resetPassword(email: string): Observable<string> {
    if (this.user.getValue()) {
      throw new Error('Already logged in!');
    }
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

  logout() {
    // Destroy the persisted user data
    // Actually don't destroy it because we want to preserve guest accounts in local storage
    // this.dataStoreService.remove(this.STORAGE_KEY);
    this.dataStoreService.set(LOGGED_IN, 'false');
    this._isSuperAdmin = false;
    this.user.next(undefined);
  }

  getUser(): User {
    return this.user.getValue();
  }

  wasLoggedIn(): boolean {
    return this.dataStoreService.get(LOGGED_IN) === 'true';
  }

  isLoggedIn(): boolean {
    return !!this.user.getValue();
  }

  assignRole(role: UserRole): void {
    const u = this.user.getValue();
    u.role = role;
    this.setUser(u);
  }

  getRole(): UserRole {
    return this.isLoggedIn() ? this.user.getValue().role : undefined;
  }

  getToken(): string {
    return this.isLoggedIn() ? this.user.getValue().token : undefined;
  }

  getUserAsSubject(): BehaviorSubject<User> {
    return this.user;
  }

  hasAccess(shortId: string, role: UserRole): boolean {
    const usersRole = this.roomAccess.get(shortId);
    if (usersRole === undefined) {
      return false;
    }
    return usersRole >= role;
  }

  setAccess(shortId: string, role: UserRole): void {
    this.roomAccess.set(shortId, role);
    this.saveAccessToLocalStorage();
  }

  removeAccess(shortId: string): void {
    this.roomAccess.delete(shortId);
    this.saveAccessToLocalStorage();
  }

  saveAccessToLocalStorage(): void {
    const arr = [];
    this.roomAccess.forEach((key, value) => {
      arr.push(key + '_' + String(value));
    });
    localStorage.setItem(ROOM_ACCESS, JSON.stringify(arr));
  }

  checkAccess(shortId: string): void {
    if (!this.isLoggedIn()) {
      return;
    }
    if (this.hasAccess(shortId, UserRole.CREATOR)) {
      this.assignRole(UserRole.CREATOR);
    } else if (this.hasAccess(shortId, UserRole.EXECUTIVE_MODERATOR)) {
      this.assignRole(UserRole.EXECUTIVE_MODERATOR);
    } else if (this.hasAccess(shortId, UserRole.PARTICIPANT)) {
      this.assignRole(UserRole.PARTICIPANT);
    }
  }

  checkSuperAdmin(): Observable<boolean> {
    if (!this.user.getValue()) {
      throw new Error('Not logged in!');
    }
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + this.apiUrl.superAdmin;
    return this.http.get(connectionUrl, this.httpOptions).pipe(
      tap(_ => ''),
      catchError(err => of(err.error?.message || err))
    );
  }

  private checkLogin(clientAuthentication: Observable<ClientAuthentication>,
                     userRole: UserRole): Observable<LoginResult> {
    return clientAuthentication.pipe(
      map((result) => {
        if (!result) {
          return LoginResult.Failure;
        }
        this.setUser(new User(
          result.credentials,
          result.name,
          result.type,
          result.details,
          userRole,
          result.type === 'guest'));
        return LoginResult.Success;
      }),
      catchError((e) => {
        // check if user needs activation
        if (e.error?.status === 403) {
          if (e.error?.message === 'Activation in process') {
            return of(LoginResult.FailureActivation);
          } else if (e.error?.message === 'Password reset in process') {
            return of(LoginResult.FailurePasswordReset);
          }
        }
        console.error(e);
        return of(LoginResult.FailureException);
      }));
  }

  private setUser(user: User): void {
    const previousId = JSON.parse(this.dataStoreService.get(STORAGE_KEY) || null)?.id;
    if (previousId !== user?.id) {
      this.roomAccess.clear();
      this.saveAccessToLocalStorage();
    }
    this.dataStoreService.set(STORAGE_KEY, JSON.stringify(user));
    this.dataStoreService.set(LOGGED_IN, String(Boolean(user)));
    this.user.next(user);
    if (user) {
      this.checkSuperAdmin().subscribe(res => this._isSuperAdmin = !!res);
    } else {
      this._isSuperAdmin = false;
    }
  }

  private loadRoomAccesses() {
    const data = this.dataStoreService.get(ROOM_ACCESS);
    if (!data) {
      return;
    }
    const creatorAccess = JSON.parse(data);
    creatorAccess.forEach(cA => {
      const roleNumber = cA.substring(0, 1);
      const shortId: string = cA.substring(2);
      if (roleNumber === '3') {
        this.roomAccess.set(shortId, UserRole.CREATOR);
      } else if (roleNumber === '2') {
        this.roomAccess.set(shortId, UserRole.EXECUTIVE_MODERATOR);
      } else {
        this.roomAccess.set(shortId, UserRole.PARTICIPANT);
      }
    });
  }
}
