import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  map,
  merge,
  shareReplay,
  startWith,
  switchMap,
  throwError,
} from 'rxjs';
import { AuthenticationService } from '../http/authentication.service';
import { ClientAuthentication } from 'app/models/client-authentication';
import { User } from 'app/models/user';
import { UUID } from 'app/utils/ts-utils';
import { UserRole } from 'app/models/user-roles.enum';
import { DbReadMotdService } from '../persistence/db-read-motd.service';

type ManagedAccount = User

@Injectable({
  providedIn: 'root',
})
export class AccountStateService {
  readonly user$ = new BehaviorSubject<ManagedAccount>(null);
  readonly access$ = this.user$.pipe(shareReplay(1));
  readonly readMotds$ = this.user$.pipe(
    switchMap((user) =>
      this.dbReadMotd.getAllByIndex('user-id', user.id).pipe(startWith(null)),
    ),
    shareReplay(1),
  );

  constructor(
    private authService: AuthenticationService,
    private dbReadMotd: DbReadMotdService,
  ) {}

  logout(): Observable<void> {
    if (!this.user$.value) {
      return throwError(() => 'User already logged out');
    }
    // do some stuff
    this.setUser(null);
  }

  login(token: string, roles: string[]): Observable<ManagedAccount> {
    if (this.user$.value) {
      return throwError(() => 'User already logged in');
    }
  }

  openGuestSession(): Observable<ManagedAccount> {
    if (this.user$.value) {
      return throwError(() => 'Guest already logged in');
    }
    return this.authService
      .loginAsGuest()
      .pipe(map((auth) => this.fromAuth(auth)));
  }

  setAccess(roomShortId: string, roomId: string, role: UserRole) {}

  private setUser(user: ManagedAccount) {
    localStorage.setItem('logged-in', user ? 'true' : 'false');
    this.user$.next(user);
  }

  private fromAuth(auth: ClientAuthentication) {
    return new User({
      id: auth.credentials as UUID,
      loginId: auth.name,
      type: auth.type,
      token: auth.details,
      isGuest: auth.type === 'guest',
    });
  }
}
