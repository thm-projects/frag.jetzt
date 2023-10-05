import { Injectable } from '@angular/core';
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import {
  BehaviorSubject,
  Observable,
  Subject,
  defer,
  from,
  of,
  repeat,
  retry,
  shareReplay,
  switchMap,
  take,
} from 'rxjs';
import { KeycloakProviderService } from '../http/keycloak-provider.service';
import { KeycloakProvider } from 'app/models/keycloak-provider';
import { UUID } from 'app/utils/ts-utils';
import { DsgvoBuilder } from 'app/utils/dsgvo-builder';
import { InitService } from './init.service';

export interface TokenReturn {
  token: string;
  refreshToken: string;
  keycloakId: UUID;
  roles: string[];
}

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  readonly providers$ = this.keycloakProvider.getAll();
  readonly activeProvider$ = new BehaviorSubject<KeycloakProvider>(null);
  private keycloak: Keycloak;
  private updateStream$ = new Subject();
  private tokenUpdated: (newToken: TokenReturn) => void;

  constructor(
    private keycloakProvider: KeycloakProviderService,
    private initService: InitService,
  ) {
    this.providers$ = keycloakProvider.getAll().pipe(
      repeat({
        delay: () => this.updateStream$,
      }),
      shareReplay(1),
    );
    this.initService.init$.pipe(take(1)).subscribe(() => {
      // side effects
      this.providers$.subscribe((providers) => {
        providers.forEach((provider) => {
          DsgvoBuilder.trustURL(this.adjustURL(provider.frontendUrl));
        });
      });
    });
  }

  update() {
    this.updateStream$.next(true);
  }

  redirectAccountManagement() {
    this.keycloak.accountManagement();
  }

  doKeycloakLogin(
    keycloakId: UUID,
    force: boolean,
    language: string,
    tokenUpdated: (token: TokenReturn) => void,
    redirectUri: string,
    token: string,
    refreshToken: string,
  ): Observable<TokenReturn> {
    return this.providers$.pipe(
      take(1),
      switchMap((providers) => {
        let activeProvider = null;
        for (const provider of providers) {
          if (provider.nameDe.length < 1) {
            activeProvider = provider;
          }
          if (keycloakId === provider.id) {
            activeProvider = provider;
            break;
          }
        }
        return this.changeProvider(activeProvider, tokenUpdated);
      }),
      switchMap(() =>
        this.login(force, language, redirectUri, token, refreshToken),
      ),
    );
  }

  private login(
    force: boolean,
    language: string,
    redirectUri: string,
    token: string,
    refreshToken: string,
  ): Observable<TokenReturn> {
    return defer(() => {
      const options: KeycloakInitOptions = {
        onLoad: force ? 'login-required' : 'check-sso',
        locale: language,
        redirectUri,
      };
      if (this.isNotExpired(token)) {
        options.token = token;
      }
      if (this.isNotExpired(refreshToken)) {
        options.refreshToken = refreshToken;
      }
      return this.keycloak.init(options).then(
        (authenticated) => {
          if (authenticated) {
            return {
              token: this.keycloak.token,
              refreshToken: this.keycloak.refreshToken,
              keycloakId: this.activeProvider$.value.id,
              roles: this.keycloak.tokenParsed?.realm_access?.roles || [],
            } as TokenReturn;
          }
          return null;
        },
        (err) => {
          console.error('Keycloak initialization error', err);
          return null;
        },
      );
    }).pipe(retry(1));
  }

  private isNotExpired(token: string): boolean {
    if (!token) {
      return false;
    }
    const start = token.indexOf('.');
    const end = token.indexOf('.', start + 1);
    const text = window.atob(token.substring(start + 1, end));
    const obj = JSON.parse(text);
    return obj['exp'] * 1000 > new Date().getTime();
  }

  private changeProvider(
    keycloakProvider: KeycloakProvider,
    tokenUpdated: (newToken: TokenReturn) => void,
  ): Observable<Keycloak> {
    const onContinue = () => {
      if (keycloakProvider == null) {
        return null;
      }
      const newKeycloak = new Keycloak({
        url: this.adjustURL(keycloakProvider.frontendUrl),
        realm: keycloakProvider.realm,
        clientId: keycloakProvider.clientId,
      });
      this.keycloak = newKeycloak;
      this.tokenUpdated = tokenUpdated;
      this.activeProvider$.next(keycloakProvider);
      newKeycloak.onTokenExpired = () => {
        if (this.keycloak !== newKeycloak) return;
        newKeycloak.updateToken(30).then(
          () => '',
          (e) => console.error('Keycloak refresh error', e),
        );
      };
      newKeycloak.onAuthRefreshSuccess = () => {
        this.updateUser(newKeycloak);
      };
      newKeycloak.onAuthSuccess = () => {
        this.updateUser(newKeycloak);
      };
      return newKeycloak;
    };
    let expiresIn = -1;
    const oldKeycloak = this.keycloak;
    this.keycloak = null;
    this.tokenUpdated = null;
    this.activeProvider$.next(null);
    if (oldKeycloak != null) {
      expiresIn =
        (oldKeycloak.tokenParsed?.exp || 0) -
        new Date().getTime() / 1000 +
        (oldKeycloak.timeSkew || 0);
      oldKeycloak.onTokenExpired = null;
      oldKeycloak.onAuthRefreshSuccess = null;
      oldKeycloak.onAuthSuccess = null;
    }
    if (expiresIn > 0 && oldKeycloak?.authenticated) {
      return from(
        oldKeycloak
          .logout({
            redirectUri: `${location.origin}/home`,
          })
          .then(
            () => onContinue(),
            (e) => {
              console.error('Keycloak logout error', e);
              return onContinue();
            },
          ),
      );
    } else {
      return of(onContinue());
    }
  }

  private adjustURL(url: string) {
    if (url.startsWith('/')) {
      return location.origin + url;
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'http://' + url;
    }
    return url;
  }

  private updateUser(keycloak: Keycloak) {
    if (this.keycloak !== keycloak) {
      return;
    }
    this.tokenUpdated({
      token: this.keycloak.token,
      refreshToken: this.keycloak.refreshToken,
      keycloakId: this.activeProvider$.value.id,
      roles: this.keycloak.tokenParsed?.realm_access?.roles || [],
    });
  }
}
