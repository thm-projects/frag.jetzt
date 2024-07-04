import { computed, signal } from '@angular/core';
import { getInjector } from 'app/base/angular-init';
import { dataService } from 'app/base/db/data-service';
import { language } from 'app/base/language/language';
import { ClientAuthentication } from 'app/models/client-authentication';
import { User } from 'app/models/user';
import { AuthenticationService } from 'app/services/http/authentication.service';
import {
  KeycloakService,
  TokenReturn,
} from 'app/services/util/keycloak.service';
import { UUID } from 'app/utils/ts-utils';
import {
  Observable,
  catchError,
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
          // TODO: Find all possible errors
          console.error(e);
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

const loadKeycloakAccount = (id: UUID, forceLogin = true): Observable<User> => {
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
      4;
      return forkJoin([
        keycloak.doKeycloakLogin(
          id,
          forceLogin,
          language(),
          (newToken) => updateToken(newToken),
          location.href,
          token,
          refreshToken,
        ),
        of(injector),
        of(user),
      ]);
    }),
    switchMap(([keycloakData, injector, user]) => {
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
            return user?.keycloakProviderId === keycloakData.keycloakId
              ? dataService.config
                  .delete('account-registered')
                  .pipe(map(() => null))
              : of(null);
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
          switchMap(() => loadKeycloakAccount(id)),
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

export const logout = (): Observable<void> => {
  if (userSignal() === undefined) {
    return throwError(() => 'logout: User not loaded / initialized');
  }
  return dataService.config
    .createOrUpdate({ key: 'logged-in', value: 'false' })
    .pipe(
      tap(() => userSignal.set(null)),
      switchMap(() => of()),
    );
};

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
      return loadKeycloakAccount(v as UUID, false);
    }),
  )
  .subscribe((user) => userSignal.set(user));
