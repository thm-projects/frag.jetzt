import { Injectable } from '@angular/core';
import {
  Observable,
  Subject,
  catchError,
  concat,
  distinctUntilChanged,
  filter,
  forkJoin,
  from,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { AuthenticationService } from '../http/authentication.service';
import { ClientAuthentication } from 'app/models/client-authentication';
import { User } from 'app/models/user';
import { UUID } from 'app/utils/ts-utils';
import { UserRole } from 'app/models/user-roles.enum';
import { DbReadMotdService } from '../persistence/lg/db-read-motd.service';
import { DbRoomAccessService } from '../persistence/lg/db-room-access.service';
import { DbConfigService } from '../persistence/lg/db-config.service';
import { GptService } from '../http/gpt.service';
import { OnlineStateService } from './online-state.service';
import {
  LoginDialogRequest,
  MotdDialogRequest,
  callServiceEvent,
  sendEvent,
} from 'app/utils/service-component-events';
import { KeycloakService, TokenReturn } from '../util/keycloak.service';
import { AppStateService } from './app-state.service';
import { RoomAccess } from '../persistence/lg/db-room-acces.model';
import { ReadMotd } from '../persistence/lg/db-read-motd.model';
import { EventService } from '../util/event.service';
import { Router } from '@angular/router';
import { InitService } from '../util/init.service';

@Injectable({
  providedIn: 'root',
})
export class AccountStateService {
  readonly user$: Observable<User>;
  readonly access$: Observable<RoomAccess[]>;
  readonly readMotds$: Observable<ReadMotd[]>;
  readonly unreadMotds$: Observable<boolean>;
  readonly gptConsented$: Observable<boolean>;
  private readonly updateUser$ = new Subject<User>();
  private readonly updateAccess$ = new Subject<boolean>();
  private readonly updateReadMotds$ = new Subject<boolean>();
  private readonly updateGptConsented$ = new Subject<boolean>();
  private initialized = false;

  constructor(
    private authService: AuthenticationService,
    private dbReadMotd: DbReadMotdService,
    private dbRoomAccess: DbRoomAccessService,
    private dbConfig: DbConfigService,
    private gptService: GptService,
    private onlineState: OnlineStateService,
    private keycloak: KeycloakService,
    private appState: AppStateService,
    private eventService: EventService,
    private initService: InitService,
    private router: Router,
  ) {
    this.user$ = concat(this.loadUser(), this.updateUser$).pipe(
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.access$ = merge(this.user$, this.updateAccess$).pipe(
      switchMap((value) => {
        const isUpdate = typeof value === 'boolean';
        const user = this.getCurrentUser();
        if (!user) {
          return of(null);
        }
        const local = this.dbRoomAccess.getAllByIndex('user-id', user.id);
        return isUpdate ? local : local.pipe(startWith(null));
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.readMotds$ = merge(this.user$, this.updateReadMotds$).pipe(
      switchMap(() => {
        const user = this.getCurrentUser();
        if (!user) {
          return of(null);
        }
        return this.dbReadMotd
          .getAllByIndex('user-id', user.id)
          .pipe(startWith(null));
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.unreadMotds$ = merge(this.appState.motd$, this.readMotds$).pipe(
      map(() => {
        const motds = this.appState.getCurrentMotds();
        if (!motds) {
          return false;
        }
        const readMotds = this.getCurrentReadMotds();
        if (!readMotds) {
          return false;
        }
        const readSet = new Set(readMotds.map((r) => r.motdId));
        return motds.some((m) => !readSet.has(m.id));
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.gptConsented$ = merge(this.user$, this.updateGptConsented$).pipe(
      switchMap((v) => {
        if (typeof v === 'boolean') {
          return of(v);
        }
        if (!v) {
          return of(undefined);
        }
        return this.onlineState.refreshWhenReachable(
          of(null),
          this.gptService.getConsentState(),
        );
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    // Side effects
    // Read Motds => motd dialog
    this.initService.init$.subscribe(() => {
      this.unreadMotds$
        .pipe(
          filter((unread) => unread),
          take(1),
        )
        .subscribe(() => {
          sendEvent(
            this.eventService,
            new MotdDialogRequest(this.appState.getCurrentMotds()),
          );
        });
    });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getCurrentUser(): User {
    let returnUser = null;
    this.user$
      .subscribe((user) => {
        returnUser = user;
      })
      .unsubscribe();
    return returnUser;
  }

  getCurrentReadMotds(): ReadMotd[] {
    let readMotds = null;
    this.readMotds$.subscribe((r) => (readMotds = r)).unsubscribe();
    return readMotds;
  }

  logout(): Observable<boolean> {
    if (!this.getCurrentUser()) {
      return throwError(() => 'User already logged out');
    }
    return forkJoin([
      this.dbConfig.delete('account-registered'),
      this.setLoggedIn('false'),
    ]).pipe(
      switchMap(() => from(this.router.navigate(['/']))),
      tap(() => this.updateUser$.next(null)),
    );
  }

  openLogin(): Observable<User> {
    if (!this.initialized) {
      return throwError(() => 'Not initialized');
    }
    if (this.getCurrentUser()) {
      return throwError(() => 'User already logged in');
    }
    return this.redirectLogin().pipe(
      tap((user) => this.updateUser$.next(user)),
    );
  }

  openGuestSession(): Observable<User> {
    if (!this.initialized) {
      return throwError(() => 'Not initialized');
    }
    if (this.getCurrentUser()) {
      return throwError(() => 'Guest already logged in');
    }
    return this.makeGuestSession(true, false).pipe(
      tap((user) => this.updateUser$.next(user)),
    );
  }

  forceLogin(): Observable<User> {
    return this.user$.pipe(
      take(1),
      switchMap((user) => {
        if (user) {
          return of(user);
        }
        return this.openGuestSession();
      }),
    );
  }

  updateToken(keycloakToken: TokenReturn) {
    forkJoin([
      this.dbConfig.get('logged-in'),
      this.dbConfig.get('account-registered'),
    ])
      .pipe(
        switchMap(([logged, userCfg]) => {
          if (logged.value !== keycloakToken.keycloakId) {
            return throwError(
              () => 'updateToken: Try to update other keycloak data',
            );
          }
          const user = userCfg?.value as User;
          if (!user) {
            // in login phase
            return of();
          }
          user.keycloakToken = keycloakToken.token;
          user.keycloakRefreshToken = keycloakToken.refreshToken;
          user.keycloakRoles = keycloakToken.roles;
          return this.dbConfig.createOrUpdate({
            key: 'account-registered',
            value: user,
          });
        }),
      )
      .subscribe();
  }

  setAccess(
    roomShortId: string,
    roomId: string,
    role: UserRole,
  ): Observable<void> {
    const userId = this.getCurrentUser()?.id;
    if (!userId) {
      throw new Error('setAccess: User not logged in');
    }
    return this.dbRoomAccess
      .createOrUpdate(
        new RoomAccess({
          userId,
          roomId,
          roomShortId,
          role:
            role === UserRole.CREATOR
              ? 'Creator'
              : role > UserRole.PARTICIPANT
              ? 'Moderator'
              : 'Participant',
          lastAccess: new Date(),
        }),
      )
      .pipe(
        tap(() => this.updateAccess$.next(true)),
        map(() => undefined),
      );
  }

  updateAccess(roomShortId: string) {
    const userId = this.getCurrentUser()?.id;
    if (!userId) {
      throw new Error('updateAccess: User not logged in');
    }
    this.dbRoomAccess
      .get([userId, roomShortId])
      .pipe(
        switchMap((v) => {
          if (!v) {
            return of();
          }
          v.lastAccess = new Date();
          return this.dbRoomAccess.createOrUpdate(v);
        }),
      )
      .subscribe(() => this.updateAccess$.next(true));
  }

  removeAccess(roomShortId: string) {
    const userId = this.getCurrentUser()?.id;
    if (!userId) {
      throw new Error('removeAccess: User not logged in');
    }
    this.dbRoomAccess
      .delete([userId, roomShortId])
      .subscribe(() => this.updateAccess$.next(true));
  }

  getAccess(roomShortId: string) {
    const userId = this.getCurrentUser()?.id;
    if (!userId) {
      throw new Error('getAccess: User not logged in');
    }
    let current: RoomAccess[] = null;
    this.access$.subscribe((data) => (current = data)).unsubscribe();
    current = current || [];
    const data = current.find(
      (r) => r.roomShortId === roomShortId && r.userId === userId,
    );
    return data;
  }

  hasAccess(roomShortId: string, role: UserRole) {
    if (role === UserRole.PARTICIPANT) {
      return true;
    }
    const accessRole = this.getAccess(roomShortId)?.role;
    const isCreator = accessRole === 'Creator';
    const isModerator = accessRole === 'Moderator';
    if (role === UserRole.CREATOR) return isCreator;
    if (role === UserRole.EXECUTIVE_MODERATOR) return isCreator || isModerator;
    return false;
  }

  ensureAccess(roomShortId: string, roomId: string, role: UserRole) {
    if (!this.getAccess(roomShortId)) {
      this.setAccess(roomShortId, roomId, role).subscribe();
      return true;
    }
    return false;
  }

  readMotds(motdIds: string[]) {
    const userId = this.getCurrentUser()?.id;
    if (!userId) {
      throw new Error('readMotds: User not logged in');
    }
    this.dbReadMotd
      .createOrUpdateMany(
        motdIds.map((motdId) => ({ value: new ReadMotd({ motdId, userId }) })),
      )
      .subscribe(() => this.updateReadMotds$.next(true));
  }

  unreadMotd(motdId: string) {
    const userId = this.getCurrentUser()?.id;
    if (!userId) {
      throw new Error('unreadMotd: User not logged in');
    }
    this.dbReadMotd
      .delete([motdId, userId])
      .subscribe(() => this.updateReadMotds$.next(true));
  }

  updateGPTConsentState(result: boolean) {
    const consentState = Boolean(result);

    this.gptService
      .updateConsentState(consentState)
      .pipe(tap((data) => this.updateGptConsented$.next(data)))
      .subscribe();
  }

  private makeGuestSession(force: boolean, navigate: boolean) {
    return this.dbConfig.get('account-guest').pipe(
      switchMap((userCfg) => {
        if (!userCfg?.value) {
          return of(null);
        }
        const user = userCfg.value as User;
        return this.authService.refreshLoginWithToken(user.token).pipe(
          map((auth) => this.fromAuth(auth, null)),
          switchMap((auth) => this.setLoggedIn('guest').pipe(map(() => auth))),
          catchError(() => of(null)),
        );
      }),
      switchMap((user) => {
        if (!user && force) {
          return this.loginAsGuest(navigate);
        }
        if (navigate) {
          this.router.navigate(['/user']);
        }
        return of(user);
      }),
    );
  }

  private redirectLogin(): Observable<User> {
    return callServiceEvent(
      this.eventService,
      new LoginDialogRequest(window.location.href),
    ).pipe(
      switchMap((response) => {
        if (response.keycloakId === undefined) {
          return of(null);
        }
        if (!response.keycloakId) {
          return this.makeGuestSession(true, true);
        }
        return this.doKeycloakLogin(response.keycloakId, true);
      }),
    );
  }

  private loadUser(): Observable<User> {
    return this.dbConfig.get('logged-in').pipe(
      map((cfg) => cfg?.value || 'false'),
      switchMap((v) => {
        if (v === 'false') {
          this.initialized = true;
          return of(null);
        }
        return this.loginWithSavedUser(v as UUID | 'guest');
      }),
    );
  }

  private loginWithSavedUser(value: 'guest' | UUID) {
    if (value !== 'guest') {
      this.initialized = true;
      return this.doKeycloakLogin(value as UUID, false).pipe(
        switchMap((data) => {
          if (data) {
            return of(data);
          }
          return this.redirectLogin();
        }),
      );
    }
    return this.makeGuestSession(false, false).pipe(
      tap(() => (this.initialized = true)),
    );
  }

  private doKeycloakLogin(
    keycloakId: UUID,
    redirectUser: boolean,
  ): Observable<User> {
    return forkJoin([
      this.dbConfig.get('logged-in'),
      this.dbConfig.get('account-registered'),
    ]).pipe(
      switchMap(([loggedCfg, accCfg]) => {
        if (loggedCfg?.value !== keycloakId) {
          return forkJoin([
            this.setLoggedIn(keycloakId),
            this.dbConfig.delete('account-registered'),
          ]).pipe(map(() => ({ token: undefined, refreshToken: undefined })));
        }
        const user = accCfg?.value as User;
        return of({
          token: user?.keycloakToken,
          refreshToken: user?.keycloakRefreshToken,
        });
      }),
      switchMap((data) =>
        this.keycloak.doKeycloakLogin(
          keycloakId,
          redirectUser,
          this.appState.getCurrentLanguage(),
          (newToken) => this.updateToken(newToken),
          redirectUser ? location.origin + '/user' : location.href,
          data?.token,
          data?.refreshToken,
        ),
      ),
      switchMap((data) => {
        if (!data) {
          return of(null);
        }
        return this.loginAsUser(data, redirectUser);
      }),
    );
  }

  private loginAsUser(tokenReturn: TokenReturn, navigate: boolean) {
    return this.authService
      .login(tokenReturn.token, tokenReturn.keycloakId)
      .pipe(
        map((auth) => this.fromAuth(auth, tokenReturn)),
        switchMap((user) =>
          forkJoin([
            this.dbConfig.createOrUpdate({
              key: 'account-registered',
              value: user,
            }),
            this.setLoggedIn(tokenReturn.keycloakId),
          ]).pipe(map(() => user)),
        ),
        tap((v) => {
          this.initialized = true;
          if (v && navigate) {
            this.router.navigate(['/user']);
          }
        }),
      );
  }

  private loginAsGuest(navigate: boolean) {
    return this.authService.loginAsGuest().pipe(
      map((auth) => this.fromAuth(auth, null)),
      switchMap((user) =>
        forkJoin([
          this.dbConfig.createOrUpdate({ key: 'account-guest', value: user }),
          this.setLoggedIn('guest'),
        ]).pipe(map(() => user)),
      ),
      tap((v) => {
        this.initialized = true;
        if (v && navigate) {
          this.router.navigate(['/user']);
        }
      }),
    );
  }

  private setLoggedIn(value: 'false' | 'guest' | UUID) {
    return this.dbConfig.createOrUpdate({ key: 'logged-in', value });
  }

  private fromAuth(auth: ClientAuthentication, keycloakData: TokenReturn) {
    return new User({
      id: auth.credentials as UUID,
      loginId: auth.name,
      type: auth.type,
      token: auth.details,
      keycloakToken: keycloakData?.token,
      keycloakRefreshToken: keycloakData?.refreshToken,
      keycloakRoles: keycloakData?.roles,
      isGuest: auth.type === 'guest',
    });
  }
}
