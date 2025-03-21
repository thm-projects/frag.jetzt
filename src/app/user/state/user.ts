import { computed, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { getInjector } from 'app/base/angular-init';
import { dataService } from 'app/base/db/data-service';
import { language } from 'app/base/language/language';
import { ClientAuthentication } from 'app/models/client-authentication';
import { User } from 'app/models/user';
import { AuthenticationService } from 'app/services/http/authentication.service';
import { EventService } from 'app/services/util/event.service';
import {
  KeycloakService,
  TokenReturn,
} from 'app/services/util/keycloak.service';
import {
  callServiceEvent,
  LoginDialogRequest,
} from 'app/utils/service-component-events';
import { UUID } from 'app/utils/ts-utils';
import {
  Observable,
  catchError,
  filter,
  first,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

/**
 * undefined: not loaded
 * null | User: loaded
 */
const userSignal = signal<User | null | undefined>(undefined);
export const isLoggedIn = computed(() => Boolean(userSignal()));
export const user = userSignal.asReadonly();
export const user$ = getInjector().pipe(
  switchMap((injector) => toObservable(userSignal, { injector })),
);

// api methods

const fromAuth = (auth: ClientAuthentication, keycloakData: TokenReturn) => {
  return new User({
    id: auth.credentials as UUID,
    loginId: auth.name,
    type: auth.type,
    token: auth.details,
    keycloakProviderId: keycloakData?.keycloakId,
    keycloakToken: keycloakData?.token,
    keycloakRefreshToken: keycloakData?.refreshToken,
    keycloakRoles: keycloakData?.roles,
    isGuest: auth.type === 'guest',
  });
};

// guest methods

const loadGuestAccount = (): Observable<User> => {
  return forkJoin([
    dataService.config.get('account-guest'),
    getInjector(),
  ]).pipe(
    switchMap(([userCfg, injector]) => {
      if (!userCfg?.value) {
        return of(null);
      }
      const user = userCfg.value as User;
      const authService = injector.get(AuthenticationService);
      return authService.refreshLoginWithToken(user.token).pipe(
        map((auth) => fromAuth(auth, null)),
        switchMap((user) =>
          dataService.config
            .createOrUpdate({
              key: 'account-guest',
              value: user,
            })
            .pipe(map(() => user)),
        ),
        catchError((e) => {
          console.error(e);
          if (e?.status !== 401) {
            return of(null);
          }
          return dataService.config
            .delete('account-guest')
            .pipe(map(() => null));
        }),
      );
    }),
  );
};

const loadNewGuestAccount = (): Observable<User> => {
  return getInjector().pipe(
    switchMap((injector) => {
      const authService = injector.get(AuthenticationService);
      return authService.loginAsGuest().pipe(
        map((auth) => fromAuth(auth, null)),
        switchMap((user) =>
          dataService.config
            .createOrUpdate({
              key: 'account-guest',
              value: user,
            })
            .pipe(map(() => user)),
        ),
      );
    }),
  );
};

export const loginAsGuest = () => {
  if (userSignal() === undefined) {
    return throwError(() => 'logout: User not loaded / initialized');
  }
  return loadGuestAccount().pipe(
    switchMap((user) => {
      if (user) {
        return of(user);
      }
      return loadNewGuestAccount();
    }),
    switchMap((user) => {
      return user
        ? dataService.config
            .createOrUpdate({
              key: 'logged-in',
              value: 'guest',
            })
            .pipe(map(() => user))
        : of(null);
    }),
    tap((user) => userSignal.set(user)),
  );
};

// Keycloak methods

const updateToken = (token: TokenReturn) => {
  dataService.config
    .get('account-registered')
    .pipe(
      switchMap((userCfg) => {
        const user = userCfg?.value as User;
        if (!user) {
          return of();
        }
        if (user.keycloakProviderId !== token.keycloakId) {
          return throwError(
            () => 'updateToken: Try to update other keycloak data',
          );
        }
        user.keycloakToken = token.token;
        user.keycloakRefreshToken = token.refreshToken;
        user.keycloakRoles = token.roles;
        return dataService.config.createOrUpdate({
          key: 'account-registered',
          value: user,
        });
      }),
    )
    .subscribe();
};

const loadKeycloakAccount = (
  id: UUID,
  forceLogin: boolean,
  redirectUrl: string,
): Observable<User> => {
  return forkJoin([
    dataService.config.get('account-registered'),
    getInjector(),
  ]).pipe(
    switchMap(([userCfg, injector]) => {
      let token: string = undefined;
      let refreshToken: string = undefined;
      const user = userCfg?.value as User;
      if (user?.keycloakProviderId === id) {
        token = user.keycloakToken;
        refreshToken = user.keycloakRefreshToken;
      }
      const keycloak = injector.get(KeycloakService);
      return forkJoin([
        keycloak.doKeycloakLogin(
          id,
          forceLogin,
          language(),
          (newToken) => updateToken(newToken),
          redirectUrl,
          token,
          refreshToken,
        ),
        of(injector),
      ]);
    }),
    switchMap(([keycloakData, injector]) => {
      if (!keycloakData) {
        return of(null);
      }
      const authService = injector.get(AuthenticationService);
      return authService
        .login(keycloakData.token, keycloakData.keycloakId)
        .pipe(
          map((auth) => fromAuth(auth, keycloakData)),
          switchMap((user) => {
            return dataService.config
              .createOrUpdate({
                key: 'account-registered',
                value: user,
              })
              .pipe(map(() => user));
          }),
          catchError((e) => {
            // TODO: Find all possible errors
            console.error(e);
            return dataService.config
              .delete('account-registered')
              .pipe(map(() => null));
          }),
        );
    }),
  );
};

export const loginKeycloak = (id: UUID): Observable<User> => {
  if (userSignal() === undefined) {
    return throwError(() => 'logout: User not loaded / initialized');
  }
  return dataService.config.get('logged-in').pipe(
    switchMap((oldValue) => {
      return dataService.config
        .createOrUpdate({
          key: 'logged-in',
          value: id,
        })
        .pipe(
          switchMap(() =>
            loadKeycloakAccount(id, true, location.origin + '/user'),
          ),
          switchMap((user) => {
            return user
              ? of(user)
              : dataService.config
                  .createOrUpdate({
                    key: 'logged-in',
                    value: oldValue?.value || 'false',
                  })
                  .pipe(map(() => null));
          }),
          tap((user) => userSignal.set(user)),
        );
    }),
  );
};

// logout method

export const logout = (removeUser: boolean = true): Observable<void> => {
  const user = userSignal();
  if (user === undefined) {
    return throwError(() => 'logout: User not loaded / initialized');
  }
  return getInjector().pipe(
    tap((injector) => injector.get(Router).navigate(['/'])),
    switchMap(() =>
      dataService.config.createOrUpdate({ key: 'logged-in', value: 'false' }),
    ),
    switchMap((v) => {
      if (removeUser && user.keycloakProviderId) {
        return dataService.config.delete('account-registered');
      }
      return of(v);
    }),
    tap(() => userSignal.set(null)),
    switchMap(() => of(undefined)),
  );
};

// force login

export const openLogin = (
  wasInactiveAndForcesLogin = false,
): Observable<User> => {
  return getInjector().pipe(
    switchMap((injector) =>
      callServiceEvent(
        injector.get(EventService),
        new LoginDialogRequest(wasInactiveAndForcesLogin),
      ),
    ),
    switchMap((v) => {
      if (!wasInactiveAndForcesLogin && v.keycloakId === undefined) {
        return of(null);
      }
      if (!v.keycloakId) {
        return loginAsGuest();
      }
      return loginKeycloak(v.keycloakId);
    }),
  );
};

export const forceLogin = (): Observable<User> => {
  return user$.pipe(first((v) => v !== undefined)).pipe(
    switchMap((user) => {
      if (user) {
        return of(user);
      }
      return dataService.config.get('logged-in').pipe(
        switchMap((cfg) => {
          const value = cfg?.value;
          if (!value || value === 'false') {
            return loginAsGuest();
          }
          return openLogin(true);
        }),
      );
    }),
  );
};

export const ensureLoggedIn = () =>
  user$.pipe(
    filter((v) => v !== undefined),
    switchMap((user) => (user ? of(user) : forceLogin())),
  );

// side effect

dataService.config
  .get('logged-in')
  .pipe(
    map((cfg) => cfg?.value || 'false'),
    switchMap((v) => {
      if (v === 'false') {
        return of(null);
      }
      if (v === 'guest') {
        return loadGuestAccount();
      }
      return loadKeycloakAccount(v as UUID, false, location.href);
    }),
  )
  .subscribe((user) => userSignal.set(user));
