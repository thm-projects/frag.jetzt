import { catchError, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { Observable ,  of ,  BehaviorSubject } from 'rxjs';
import { UserRole } from '../../models/user-roles.enum';
import { DataStoreService } from '../util/data-store.service';
import { EventService } from '../util/event.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ClientAuthentication } from '../../models/client-authentication';

@Injectable()
export class AuthenticationService {
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
    if (dataStoreService.has(this.STORAGE_KEY)) {
      // Load user data from local data store if available
      this.user.next(JSON.parse(dataStoreService.get(this.STORAGE_KEY)));
    }
    if (localStorage.getItem(this.ROOM_ACCESS)) {
      // Load user data from local data store if available
      const creatorAccess = JSON.parse(localStorage.getItem(this.ROOM_ACCESS));
      for (const cA of creatorAccess) {
        let role = UserRole.PARTICIPANT;
        const roleAsNumber: string = cA.substring(0, 1);
        const roomId: string = cA.substring(2);
        if (roleAsNumber === '3') {
          role = UserRole.CREATOR;
        } else if (roleAsNumber === '2') {
          role = UserRole.EXECUTIVE_MODERATOR;
        }
        this.roomAccess.set(roomId, role);
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
    }, this.httpOptions), userRole, false);
  }

  guestLogin(userRole: UserRole): Observable<string> {
    const connectionUrl: string = this.apiUrl.base + this.apiUrl.auth + this.apiUrl.login + this.apiUrl.guest;

    return this.checkLogin(this.http.post<ClientAuthentication>(connectionUrl, null, this.httpOptions), userRole, true);
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

  resetPassword(email: string): Observable<boolean> {
    const connectionUrl: string =
        this.apiUrl.v2 +
        this.apiUrl.user +
        '/' +
        email +
        this.apiUrl.resetPassword;

    return this.http.post(connectionUrl, {
      key: null,
      password: null
    }, this.httpOptions).pipe(
      catchError(err => {
        return of(false);
      }), map((result) => {
        return true;
      })
    );
  }

  setNewPassword(email: string, key: string, password: string): Observable<boolean> {
    const connectionUrl: string =
        this.apiUrl.v2 +
        this.apiUrl.user +
        '/' +
        email +
        this.apiUrl.resetPassword;

    return this.http.post(connectionUrl, {
      key: key,
      password: password
    }, this.httpOptions).pipe(
      catchError(err => {
        return of(false);
      }), map((result) => {
        return true;
      })
    );
  }

  logout() {
    // Destroy the persisted user data
    this.dataStoreService.remove(this.STORAGE_KEY);
    this.user.next(undefined);
  }

  getUser(): User {
    return this.user.getValue();
  }

  private setUser(user: User): void {
    this.user.next(user);
    this.dataStoreService.set(this.STORAGE_KEY, JSON.stringify(user));
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
    return clientAuthentication.pipe(map(result => {
      if (result) {
        this.setUser(new User(
          result.userId,
          result.loginId,
          result.authProvider,
          result.token,
          userRole,
          isGuest));
        return 'true';
      } else {
        return 'false';
      }
    }), catchError((e) => {
      // check if user needs activation
      if (e.error.errorType === 'DisabledException') {
        return of('activation');
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

  hasAccess(roomId: string, role: UserRole): boolean {
    const usersRole = this.roomAccess.get(roomId);
    return (usersRole && (usersRole >= role));
  }

  setAccess(roomId: string, role: UserRole): void {
    this.roomAccess.set(roomId, role);
    this.saveAccessToLocalStorage();
  }

  saveAccessToLocalStorage(): void {
    const arr = new Array();
    this.roomAccess.forEach(function (key, value) {
      arr.push(key + '_' + String(value));
    });
    localStorage.setItem(this.ROOM_ACCESS, JSON.stringify(arr));
  }
}
