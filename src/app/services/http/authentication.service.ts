import { catchError, map, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { UserRole } from '../../models/user-roles.enum';
import { DataStoreService } from '../util/data-store.service';
import { EventService } from '../util/event.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClientAuthentication } from '../../models/client-authentication';
import { BaseHttpService } from './base-http.service';

@Injectable()
export class AuthenticationService extends BaseHttpService {
  private readonly STORAGE_KEY: string = 'USER';
  private readonly ROOM_ACCESS: string = 'ROOM_ACCESS';
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
    guest: '/guest'
  };
  private httpOptions = {
    headers: new HttpHeaders({})
  };

  private roomAccess = new Map();

  constructor(
    private dataStoreService: DataStoreService,
    public eventService: EventService,
    private http: HttpClient
  ) {
    super();
    if (localStorage.getItem(this.ROOM_ACCESS)) {
      // Load user data from local data store if available
      const creatorAccess = JSON.parse(localStorage.getItem(this.ROOM_ACCESS));
      for (const cA of creatorAccess) {
        let role = UserRole.PARTICIPANT;
        const roleAsNumber: string = cA.substring(0, 1);
        const shortId: string = cA.substring(2);
        if (roleAsNumber === '3') {
          role = UserRole.CREATOR;
        } else if (roleAsNumber === '2') {
          role = UserRole.EXECUTIVE_MODERATOR;
        }
        this.roomAccess.set(shortId, role);
      }
    }
    this.eventService.on<any>('RoomJoined').subscribe(payload => {
      this.roomAccess.set(payload.id, UserRole.PARTICIPANT);
      this.saveAccessToLocalStorage();
    });
    this.eventService.on<any>('RoomDeleted').subscribe(payload => {
      this.roomAccess.delete(payload.id);
      this.saveAccessToLocalStorage();
    });
    this.eventService.on<any>('RoomCreated').subscribe(payload => {
      this.roomAccess.set(payload.id, UserRole.CREATOR);
      this.saveAccessToLocalStorage();
    });
  }

  /*
   * Three possible return values:
   * - "true": login successful
   * - "false": login failed
   * - "activation": account exists but needs activation with key
   */
  login(email: string, password: string, userRole: UserRole): Observable<string> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + this.apiUrl.registered;

    return this.checkLogin(this.http.post<ClientAuthentication>(connectionUrl, {
      loginId: email,
      password: password
    }, this.httpOptions), userRole, false).pipe(
      tap(x => {
        if (x === 'true') {
          this.eventService.broadcast('userLogin');
        }
      })
    );
  }

  refreshLogin(): void {
    if (this.dataStoreService.has(this.STORAGE_KEY)) {
      // Load user data from local data store if available
      const user: User = JSON.parse(this.dataStoreService.get(this.STORAGE_KEY));
      // ToDo: Fix this madness.
      const wasGuest = (user.authProvider === 'ARSNOVA_GUEST') ? true : false;
      const connectionUrl: string = this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + '?refresh=true';
      this.setUser(new User(
        user.id,
        user.loginId,
        user.authProvider,
        user.token,
        user.role,
        wasGuest
      ));
      this.http.post<ClientAuthentication>(connectionUrl, {}, this.httpOptions).pipe(
        tap(_ => ''),
        catchError(_ => {
          this.dataStoreService.remove(this.STORAGE_KEY);
          return of(null);
        })
      ).subscribe(nu => {
        if (nu) {
          this.setUser(new User(
            nu.credentials,
            nu.name,
            nu.authProvider,
            nu.details,
            user.role,
            wasGuest));
          this.eventService.broadcast('userLogin');
        } else {
          this.logout();
        }
      });
    }
  }

  guestLogin(userRole: UserRole): Observable<string> {
    let wasGuest = false;
    if (this.dataStoreService.has(this.STORAGE_KEY)) {
      const user: User = JSON.parse(this.dataStoreService.get(this.STORAGE_KEY));
      wasGuest = user.isGuest;
    }
    if (wasGuest) {
      this.refreshLogin();
    }
    if (!this.isLoggedIn()) {
      const connectionUrl: string = this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + this.apiUrl.guest;

      return this.checkLogin(this.http.post<ClientAuthentication>(connectionUrl, null, this.httpOptions), userRole, true).pipe(
        tap(x => {
          if (x === 'true') {
            this.eventService.broadcast('userLogin');
          }
        })
      );
    } else {
      return of('true');
    }
  }

  register(email: string, password: string): Observable<boolean> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.user + this.apiUrl.register;

    return this.http.post<boolean>(connectionUrl, {
      loginId: email,
      password: password
    }, this.httpOptions).pipe(map(() => {
      return true;
    }));
  }

  resetPassword(email: string): Observable<string> {
    const connectionUrl: string =
        this.apiUrl.base +
        this.apiUrl.user +
        '/' +
        email +
        this.apiUrl.resetPassword;

    return this.http.post(connectionUrl, {
      key: null,
      password: null
    }, this.httpOptions).pipe(
      catchError(err => {
        return of(err.error.message);
      }), map((result) => {
        return result;
      })
    );
  }

  setNewPassword(email: string, key: string, password: string): Observable<string> {
    const connectionUrl: string =
        this.apiUrl.base +
        this.apiUrl.user +
        '/' +
        email +
        this.apiUrl.resetPassword;

    return this.http.post(connectionUrl, {
      key: key,
      password: password
    }, this.httpOptions).pipe(
      catchError(err => {
        return of(err.error.message);
      }), map((result) => {
        return result;
      })
    );
  }

  logout() {
    // Destroy the persisted user data
    // Actually don't destroy it because we want to preserve guest accounts in local storage
    // this.dataStoreService.remove(this.STORAGE_KEY);
    this.dataStoreService.set('loggedin', 'false');
    this.user.next(undefined);
  }

  getUser(): User {
    return this.user.getValue();
  }

  private setUser(user: User): void {
    this.dataStoreService.set(this.STORAGE_KEY, JSON.stringify(user));
    this.dataStoreService.set('loggedin', 'true');
    this.user.next(user);
  }

  isLoggedIn(): boolean {
    return this.user.getValue() !== undefined;
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

  private checkLogin(clientAuthentication: Observable<ClientAuthentication>, userRole: UserRole, isGuest: boolean): Observable<string> {
    return clientAuthentication.pipe(map((result: any) => {
      if (result) {
        // ToDo: Fix this madness.
        isGuest = result.authProvider === 'ARSNOVA_GUEST' ? true : false;
        this.setUser(new User(
          result.credentials,
          result.name,
          result.authProvider,
          result.details,
          userRole,
          isGuest));
          this.dataStoreService.set('loggedin', 'true');
        return 'true';
      } else {
        return 'false';
      }
    }), catchError((e) => {
      // check if user needs activation
      if (e.error.status === 403) {
        if (e.error.message === 'Activation in process') {
          return of('activation');
        } else if (e.error.message === 'Password reset in process') {
          return of('password-reset');
        }
      }
      return of('false');
    }), );
  }

  get watchUser() {
    return this.user.asObservable();
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

  saveAccessToLocalStorage(): void {
    const arr = new Array();
    this.roomAccess.forEach(function (key, value) {
      arr.push(key + '_' + String(value));
    });
    localStorage.setItem(this.ROOM_ACCESS, JSON.stringify(arr));
  }

  checkAccess(shortId: string): void {
    if (this.hasAccess(shortId, UserRole.CREATOR)) {
      this.assignRole(UserRole.CREATOR);
    } else if (this.hasAccess(shortId, UserRole.EXECUTIVE_MODERATOR)) {
      this.assignRole(UserRole.EXECUTIVE_MODERATOR);
    } else if (this.hasAccess(shortId, UserRole.PARTICIPANT)) {
      this.assignRole(UserRole.PARTICIPANT);
    }
  }
}
