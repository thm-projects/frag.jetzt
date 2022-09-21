import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { forkJoin, Observable, of, ReplaySubject, switchMap, tap } from 'rxjs';
import { AuthenticationService, LoginResult, LoginResultArray } from '../http/authentication.service';
import { UserRole } from '../../models/user-roles.enum';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Immutable, Mutable } from '../../utils/ts-utils';
import { map } from 'rxjs/operators';
import { ConfigurationService } from './configuration.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { SessionService } from './session.service';
import { UserService } from '../http/user.service';
import { EventService } from './event.service';
import { callServiceEvent, LoginDialogRequest, LoginDialogResponse } from '../../utils/service-component-events';

export interface ManagedUser extends User {
  readonly isSuperAdmin: boolean;
  readonly roomAccess: Immutable<{ [shortId: string]: SavedRoomAccess }>;
  readonly readMotds: ReadonlySet<string>;
}

interface ReadMOTD {
  userId: string;
  motdId: string;
}

interface SavedRoomAccess {
  userId: string;
  roomShortId: string;
  roomId: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {

  protected _guestUser: User;
  private _currentUser: ManagedUser = null;
  private _user = new ReplaySubject<ManagedUser>(1);
  private _initialized = false;

  constructor(
    private authenticationService: AuthenticationService,
    private indexedDBService: NgxIndexedDBService,
    private configurationService: ConfigurationService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private userService: UserService,
    private router: Router,
    private eventService: EventService,
  ) {

  }

  init(guestUser: User, currentUser: User): Observable<any> {
    if (this._initialized) {
      return of(null);
    }
    this.setInitialized();
    this._guestUser = guestUser;
    if (!currentUser) {
      return of(null);
    }
    return this.authenticationService.refreshLoginWithToken(currentUser.token).pipe(
      switchMap(data => this.onReceive(currentUser, data, false, false, false))
    );
  }

  forceLogin(): Observable<ManagedUser> {
    if (!this.isInitialized()) {
      return of(null);
    }
    if (this.getCurrentUser()) {
      return of(this.getCurrentUser());
    }
    return this.loginAsGuest().pipe(
      map(data => data[1] as ManagedUser),
    );
  }

  loginAsGuest(): Observable<LoginResultArray> {
    if (!this._initialized) {
      return of([1, null]);
    }
    if (this._guestUser) {
      return this.authenticationService.refreshLoginWithToken(this._guestUser.token).pipe(
        switchMap(data => this.onReceive(this._guestUser, data, false, true).pipe(
          map(d => [data[0], d] as LoginResultArray),
        )),
      );
    }
    return this.injectUser(this.authenticationService.loginAsGuest());
  }

  login(email: string, password: string): Observable<LoginResultArray> {
    return this.injectUser(this.authenticationService.login(email, password));
  }

  logout(message = true) {
    this.setUser(null);
    if (message) {
      this.translateService.get('header.logged-out')
        .subscribe(msg => this.notificationService.show(msg));
    }
    if (SessionService.needsUser(this.router)) {
      this.router.navigate(['/home']);
    }
  }

  deleteAccount() {
    this.userService.delete(this.getCurrentUser()?.id).subscribe(() => {
      this.logout(false);
      this.translateService.get('header.account-deleted')
        .subscribe(msg => this.notificationService.show(msg));
    });
  }

  getCurrentToken() {
    return this.getCurrentUser()?.token;
  }

  getCurrentUser() {
    return this._currentUser;
  }

  isLoggedIn() {
    return this.getCurrentUser() != null;
  }

  getUser() {
    return this._user.asObservable();
  }

  readMOTDs(motdIds: string[]) {
    const owner = this.getCurrentUser();
    if (owner === null || owner === undefined) {
      console.error('Wrongly attempted to read motd while not registered!');
      return;
    }
    motdIds.forEach(id => {
      this.indexedDBService.update<ReadMOTD>('motdRead', {
        userId: owner.id,
        motdId: id,
      }).subscribe();
      (owner.readMotds as Set<string>).add(id);
    });
  }

  unreadMOTD(id: string) {
    const owner = this.getCurrentUser();
    if (owner === null || owner === undefined) {
      console.error('Wrongly attempted to read motd while not registered!');
      return;
    }
    this.indexedDBService.deleteByKey('motdRead', [id, owner.id]).subscribe();
    (owner.readMotds as Set<string>).delete(id);
  }

  setAccess(shortId: string, roomId: string, role: UserRole) {
    const owner = this.getCurrentUser();
    if (owner === null || owner === undefined) {
      console.error('Wrongly attempted to set access while not registered!');
      return;
    }
    const value: SavedRoomAccess = {
      userId: owner.id,
      roomShortId: shortId,
      role,
      roomId,
    };
    this.indexedDBService.update<SavedRoomAccess>('roomAccess', value).subscribe();
    (owner.roomAccess as Mutable<ManagedUser['roomAccess']>)[shortId] = value;
  }

  getAccess(shortId: string) {
    return this.getPlainAccess(shortId) ?? UserRole.PARTICIPANT;
  }

  getPlainAccess(shortId: string) {
    return this.getCurrentUser()?.roomAccess?.[shortId]?.role;
  }

  ensureAccess(shortId: string, roomId: string, role: UserRole) {
    if ((this.getCurrentUser()?.roomAccess?.[shortId]?.role ?? undefined) === undefined) {
      this.setAccess(shortId, roomId, role);
      return true;
    }
    return false;
  }

  setCurrentAccess(shortId: string) {
    const owner = this.getCurrentUser();
    if (owner === null || owner === undefined) {
      console.error('Wrongly attempted to set current access while not registered!');
      return;
    }
    if (this.getCurrentUser()) {
      this.getCurrentUser().role = this.getAccess(shortId);
    }
  }

  hasAccess(shortId: string, requiredRole: UserRole) {
    return this.getAccess(shortId) >= requiredRole;
  }

  removeAccess(shortId: string) {
    const owner = this.getCurrentUser();
    if (owner === null || owner === undefined) {
      console.error('Wrongly attempted to remove access while not registered!');
      return;
    }
    this.indexedDBService.deleteByKey('roomAccess', [owner.id, shortId])
      .subscribe();
    delete (owner.roomAccess as any)[shortId];
  }

  protected setInitialized() {
    this._initialized = true;
  }

  protected isInitialized() {
    return this._initialized;
  }

  protected onReceive(
    previousUser: User,
    result: LoginResultArray,
    retry = false,
    force = false,
    showMessage = true,
  ): Observable<ManagedUser> {
    if (result[0] === LoginResult.Success) {
      return forkJoin([
        this.authenticationService.checkSuperAdmin(result[1].token),
        this.loadMOTDs(result[1].id),
        this.loadRoomAccess(result[1].id),
      ]).pipe(
        map(([admin, motds, access]) => {
          const managedUser = result[1] as Mutable<ManagedUser>;
          managedUser.isSuperAdmin = admin;
          managedUser.readMotds = new Set(motds.map(m => m.motdId));
          managedUser.roomAccess = access.reduce((acc, value) => {
            acc[value.roomShortId] = value;
            return acc;
          }, {} as typeof managedUser['roomAccess']);
          return managedUser as ManagedUser;
        }),
        tap(user => {
          this.setUser(user);
          if (showMessage) {
            this.translateService.get('login.login-successful').subscribe(message => {
              this.notificationService.show(message);
            });
          }
        }),
      );
    }
    if (previousUser?.isGuest && !retry) {
      return this.authenticationService.loginAsGuest().pipe(
        switchMap(data => this.onReceive(previousUser, data, true)),
      );
    }
    if (force) {
      if (SessionService.needsUser(this.router)) {
        this.router.navigate(['/']);
      }
      return of(null);
    }
    return new Observable(subscriber => {
      const current = decodeURI(this.router.url);
      this.router.navigate(['/home']).then(() => {
        callServiceEvent<LoginDialogResponse, LoginDialogRequest>(
          this.eventService, new LoginDialogRequest(current)
        ).subscribe(_ => {
          subscriber.next(this.getCurrentUser());
          subscriber.complete();
        });
      });
    });
  }

  protected setUser(user: ManagedUser) {
    this._currentUser = user;
    this._user.next(user);
    this.configurationService.put('currentAccount', user).subscribe();
    if (user?.isGuest) {
      this._guestUser = user;
      this.configurationService.put('guestAccount', user).subscribe();
    }
  }

  private injectUser(obs: Observable<LoginResultArray>): Observable<LoginResultArray> {
    return obs.pipe(
      switchMap(data => {
        if (data[0] === LoginResult.Success) {
          return this.onReceive(this.getCurrentUser(), data, false, true).pipe(
            map(user => [LoginResult.Success, user] as LoginResultArray),
          );
        }
        return of(data);
      }),
    );
  }

  private loadMOTDs(userId: string) {
    return this.indexedDBService.getAllByIndex<ReadMOTD>('motdRead', 'userId', IDBKeyRange.only(userId));
  }

  private loadRoomAccess(userId: string) {
    return this.indexedDBService.getAllByIndex<SavedRoomAccess>('roomAccess', 'userId', IDBKeyRange.only(userId));
  }
}
