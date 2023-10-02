import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
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

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  readonly providers$ = this.keycloakProvider.getAll();
  readonly activeProvider$ = new BehaviorSubject<KeycloakProvider>(null);
  private keycloak: Keycloak;
  private updateStream$ = new Subject();
  private tokenUpdated: (newToken: string) => void;

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
    tokenUpdated: (newToken: string) => void,
    redirectUri: string,
  ): Observable<[token: string, keycloakId: UUID]> {
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
      switchMap(() => this.login(force, language, redirectUri)),
    );
  }

  private login(
    force: boolean,
    language: string,
    redirectUri: string,
  ): Observable<[token: string, keycloakId: UUID]> {
    return defer(() => {
      return this.keycloak
        .init({
          onLoad: force ? 'login-required' : 'check-sso',
          locale: language,
          redirectUri,
        })
        .then(
          (authenticated) => {
            if (authenticated) {
              return [this.keycloak.token, this.activeProvider$.value.id];
            }
            return null;
          },
          (err) => {
            console.log(err);
            console.error('Keycloak initialization error', err);
            return null;
          },
        );
    }).pipe(retry(1));
  }

  private changeProvider(
    keycloakProvider: KeycloakProvider,
    tokenUpdated: (newToken: string) => void,
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
    this.tokenUpdated(keycloak.token);
  }
}
