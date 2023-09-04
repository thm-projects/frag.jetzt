import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import {
  BehaviorSubject,
  forkJoin,
  Observable,
  of,
  ReplaySubject,
  tap,
} from 'rxjs';
import {
  AuthenticationService,
  LoginResult,
  LoginResultArray,
} from '../http/authentication.service';
import { UserRole } from '../../models/user-roles.enum';
import { Immutable, Mutable, UUID } from '../../utils/ts-utils';
import { filter, map, mergeMap } from 'rxjs/operators';
import { ConfigurationService } from './configuration.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';
import { SessionService } from './session.service';
import { UserService } from '../http/user.service';
import { EventService } from './event.service';
import {
  callServiceEvent,
  LoginDialogRequest,
  LoginDialogResponse,
} from '../../utils/service-component-events';
import {
  DBRoomAccessService,
  SavedRoomAccess,
} from '../persistence/dbroom-access.service';
import { GptService } from '../http/gpt.service';
import { PersistentDataService } from './persistent-data.service';

export interface ManagedUser extends User {
  readonly roomAccess: Immutable<{ [shortId: string]: SavedRoomAccess }>;
  readonly readMotds: ReadonlySet<string>;
}

interface ReadMOTD {
  userId: string;
  motdId: string;
}

const DEBUG_IGNORE_USER = true;

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  protected _guestUser: User;
  private _currentUser: ManagedUser = null;
  private _user = new ReplaySubject<ManagedUser>(1);
  private _initialized = false;
  private _gptConsentState = new BehaviorSubject(undefined);

  constructor(
    private authenticationService: AuthenticationService,
    private configurationService: ConfigurationService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private userService: UserService,
    private router: Router,
    private eventService: EventService,
    private dbRoomAccess: DBRoomAccessService,
    private gptService: GptService,
    private persistentDataService: PersistentDataService,
  ) {}

  init(guestUser: User, currentUser: User): Observable<any> {
    if (this._initialized) {
      return of(null);
    }
    this.setInitialized();
    this._guestUser = guestUser;
    if (!currentUser) {
      return of(null);
    }
    return this.authenticationService
      .refreshLoginWithToken(currentUser.token)
      .pipe(
        mergeMap((data) =>
          this.onReceive(currentUser, data, false, false, false),
        ),
      );
  }

  forceLogin(): Observable<ManagedUser> {
    if (!this.isInitialized()) {
      return of(null);
    }
    if (this.getCurrentUser()) {
      return of(this.getCurrentUser());
    }
    return this.loginAsGuest().pipe(map((data) => data[1] as ManagedUser));
  }

  loginAsGuest(): Observable<LoginResultArray> {
    if (!this._initialized) {
      return of([1, null]);
    }
    if (this._guestUser) {
      return this.authenticationService
        .refreshLoginWithToken(this._guestUser.token)
        .pipe(
          mergeMap((data) =>
            this.onReceive(this._guestUser, data, false, true).pipe(
              map((d) => [data[0], d] as LoginResultArray),
            ),
          ),
        );
    }
    return this.injectUser(this.authenticationService.loginAsGuest());
  }

  login(token: string, keycloakId: UUID): Observable<LoginResultArray> {
    return this.injectUser(this.authenticationService.login(token, keycloakId));
  }

  logout(message = true) {
    this.setUser(null);
    if (message) {
      this.translateService
        .get('header.logged-out')
        .subscribe((msg) => this.notificationService.show(msg));
    }
    if (SessionService.needsUser(decodeURI(this.router.url))) {
      this.router.navigate(['/home']);
    }
  }

  deleteAccount() {
    this.userService.delete(this.getCurrentUser()?.id).subscribe(() => {
      this.logout(false);
      this.translateService
        .get('header.account-deleted')
        .subscribe((msg) => this.notificationService.show(msg));
    });
  }

  getGPTConsentState(): Observable<boolean> {
    return this._gptConsentState.pipe(filter((e) => e !== undefined));
  }

  updateGPTConsentState(newState: boolean): Observable<boolean> {
    newState = Boolean(newState);
    if (this._gptConsentState.value === newState) {
      return of(newState);
    }
    return this.gptService
      .updateConsentState(newState)
      .pipe(tap((data) => this._gptConsentState.next(data)));
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
    motdIds.forEach((id) => {
      this.persistentDataService
        .update<ReadMOTD>('motdRead', {
          userId: owner.id,
          motdId: id,
        })
        .subscribe();
      (owner.readMotds as Set<string>).add(id);
    });
  }

  unreadMOTD(id: string) {
    const owner = this.getCurrentUser();
    if (owner === null || owner === undefined) {
      console.error('Wrongly attempted to read motd while not registered!');
      return;
    }
    this.persistentDataService
      .deleteByKey('motdRead', [id, owner.id])
      .subscribe();
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
    this.dbRoomAccess.updateEntry(value).subscribe();
    (owner.roomAccess as Mutable<ManagedUser['roomAccess']>)[shortId] = value;
  }

  getAccess(shortId: string) {
    return this.getPlainAccess(shortId) ?? UserRole.PARTICIPANT;
  }

  getPlainAccess(shortId: string) {
    return this.getCurrentUser()?.roomAccess?.[shortId]?.role;
  }

  ensureAccess(shortId: string, roomId: string, role: UserRole) {
    if (
      (this.getCurrentUser()?.roomAccess?.[shortId]?.role ?? undefined) ===
      undefined
    ) {
      this.setAccess(shortId, roomId, role);
      return true;
    }
    return false;
  }

  setCurrentAccess(shortId: string) {
    const owner = this.getCurrentUser();
    if (owner === null || owner === undefined) {
      console.error(
        'Wrongly attempted to set current access while not registered!',
      );
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
    this.persistentDataService
      .deleteByKey('roomAccess', [owner.id, shortId])
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
        this.loadMOTDs(result[1].id),
        this.dbRoomAccess.getAllByUser(result[1].id),
      ]).pipe(
        map(([motds, access]) => {
          const managedUser = result[1] as unknown as Mutable<ManagedUser>;
          managedUser.readMotds = new Set(motds.map((m) => m.motdId));
          managedUser.roomAccess = access.reduce((acc, value) => {
            acc[value.roomShortId] = value;
            return acc;
          }, {} as (typeof managedUser)['roomAccess']);
          return managedUser as ManagedUser;
        }),
        tap((user) => {
          this.setUser(user);
          if (showMessage) {
            this.translateService
              .get('login.login-successful')
              .subscribe((message) => {
                this.notificationService.show(message);
              });
          }
        }),
      );
    }
    if (previousUser?.isGuest && !retry) {
      return this.authenticationService
        .loginAsGuest()
        .pipe(mergeMap((data) => this.onReceive(previousUser, data, true)));
    }
    if (force) {
      if (SessionService.needsUser(decodeURI(this.router.url))) {
        this.router.navigate(['/']);
      }
      return of(null);
    }
    if (DEBUG_IGNORE_USER) {
      return of(null);
    }
    return new Observable((subscriber) => {
      const current = decodeURI(this.router.url);
      this.router.navigate(['/home']).then(() => {
        callServiceEvent<LoginDialogResponse, LoginDialogRequest>(
          this.eventService,
          new LoginDialogRequest(current),
        ).subscribe((_) => {
          subscriber.next(this.getCurrentUser());
          subscriber.complete();
        });
      });
    });
  }

  protected setUser(user: ManagedUser) {
    if (this._currentUser === user) {
      return;
    }
    this._initialized = true;
    this._currentUser = user;
    this._user.next(user);
    this.configurationService.put('currentAccount', user).subscribe();
    if (user?.isGuest) {
      this._guestUser = user;
      this.configurationService.put('guestAccount', user).subscribe();
    }
    if (user) {
      this.gptService
        .getConsentState()
        .subscribe((state) => this._gptConsentState.next(state));
    } else {
      this._gptConsentState.next(false);
    }
  }

  private injectUser(
    obs: Observable<LoginResultArray>,
  ): Observable<LoginResultArray> {
    return obs.pipe(
      mergeMap((data) => {
        if (data[0] === LoginResult.Success) {
          return this.onReceive(this.getCurrentUser(), data, false, true).pipe(
            map((user) => [LoginResult.Success, user] as LoginResultArray),
          );
        }
        return of(data);
      }),
    );
  }

  private loadMOTDs(userId: string) {
    return this.persistentDataService.getAllByIndex<ReadMOTD>(
      'motdRead',
      'userId',
      IDBKeyRange.only(userId),
    );
  }
}
