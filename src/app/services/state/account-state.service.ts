import { Injectable } from '@angular/core';
import {
  Observable,
  Subject,
  distinctUntilChanged,
  filter,
  first,
  forkJoin,
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
import { User } from 'app/models/user';
import { UserRole } from 'app/models/user-roles.enum';
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
import { EventService } from '../util/event.service';
import { Router } from '@angular/router';
import { InitService } from '../util/init.service';
import { RoomAccess } from 'app/base/db/models/db-room-access.model';
import { ReadMotd } from 'app/base/db/models/db-read-motd';
import { dataService } from 'app/base/db/data-service';
import { toObservable } from '@angular/core/rxjs-interop';
import { loginAsGuest, loginKeycloak, logout, user } from 'app/user/state/user';

@Injectable({
  providedIn: 'root',
})
export class AccountStateService {
  readonly user$ = toObservable(user);
  readonly access$: Observable<RoomAccess[]>;
  readonly readMotds$: Observable<ReadMotd[]>;
  readonly unreadMotds$: Observable<boolean>;
  readonly gptConsented$: Observable<boolean>;
  private readonly updateAccess$ = new Subject<boolean>();
  private readonly updateReadMotds$ = new Subject<boolean>();
  private readonly updateGptConsented$ = new Subject<boolean>();

  constructor(
    private authService: AuthenticationService,
    private gptService: GptService,
    private onlineState: OnlineStateService,
    private keycloak: KeycloakService,
    private appState: AppStateService,
    private eventService: EventService,
    private initService: InitService,
    private router: Router,
  ) {
    /*this.user$ = concat(this.loadUser(), this.updateUser$).pipe(
      distinctUntilChanged(),
      shareReplay(1),
    );*/
    this.access$ = merge(this.user$, this.updateAccess$).pipe(
      switchMap((value) => {
        const isUpdate = typeof value === 'boolean';
        const user = this.getCurrentUser();
        if (!user) {
          return of(null);
        }
        const local = dataService.roomAccess.getAllByIndex('user-id', user.id);
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
        return dataService.readMotd
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
    return user() !== undefined;
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
    logout().subscribe();
    return of(true);
  }

  openLogin(): Observable<User> {
    if (this.getCurrentUser()) {
      return throwError(() => 'User already logged in');
    }
    return this.redirectLogin().pipe(
      tap((user) => {
        if (user) {
          this.router.navigate(['/user']);
        }
      }),
    );
  }

  openGuestSession(): Observable<User> {
    return loginAsGuest();
  }

  forceLogin(): Observable<User> {
    return this.user$.pipe(
      first((u) => u !== undefined),
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
      dataService.config.get('logged-in'),
      dataService.config.get('account-registered'),
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
          return dataService.config.createOrUpdate({
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
    return dataService.roomAccess
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
    dataService.roomAccess
      .get([userId, roomShortId])
      .pipe(
        switchMap((v) => {
          if (!v) {
            return of();
          }
          v.lastAccess = new Date();
          return dataService.roomAccess.createOrUpdate(v);
        }),
      )
      .subscribe(() => this.updateAccess$.next(true));
  }

  removeAccess(roomShortId: string) {
    const userId = this.getCurrentUser()?.id;
    if (!userId) {
      throw new Error('removeAccess: User not logged in');
    }
    dataService.roomAccess
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
    dataService.readMotd
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
    dataService.readMotd
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
          return loginAsGuest();
        }
        return loginKeycloak(response.keycloakId);
      }),
    );
  }
}
