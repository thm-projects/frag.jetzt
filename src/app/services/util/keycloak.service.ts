import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { LanguageService } from './language.service';
import {
  Observable,
  Subject,
  concat,
  filter,
  from,
  merge,
  of,
  shareReplay,
  switchMap,
  take,
} from 'rxjs';
import { KeycloakProviderService } from '../http/keycloak-provider.service';
import { KeycloakProvider } from 'app/models/keycloak-provider';
import { UserManagementService } from './user-management.service';
import { UUID } from 'app/utils/ts-utils';
import { DsgvoBuilder } from 'app/utils/dsgvo-builder';

const KEYCLOAK_PROVIDER = 'keycloak-provider-id';

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  providers$: Observable<KeycloakProvider[]>;
  private keycloak: Keycloak;
  private providerId: UUID;
  private updateStream$ = new Subject();

  constructor(
    keycloakProvider: KeycloakProviderService,
    private languageService: LanguageService,
    private userManagement: UserManagementService,
  ) {
    const id = localStorage.getItem(KEYCLOAK_PROVIDER);
    this.providers$ = concat(
      keycloakProvider.getAll(),
      merge(
        userManagement.getUser().pipe(filter((v) => Boolean(v))),
        this.updateStream$,
      ).pipe(switchMap(() => keycloakProvider.getAll())),
    ).pipe(shareReplay(1));
    this.providers$.pipe(take(1)).subscribe((providers) => {
      providers.forEach((provider) => {
        DsgvoBuilder.trustURL(this.adjustURL(provider.frontendUrl));
      });
      if (id) {
        this.doKeycloakLogin(id as UUID, false).subscribe();
      }
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
    force: boolean = true,
  ): Observable<boolean> {
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
        return this.changeProvider(activeProvider);
      }),
      switchMap(() => this.login(force)),
    );
  }

  private login(force: boolean = true): Observable<boolean> {
    return from(
      this.keycloak
        .init({
          onLoad: force ? 'login-required' : 'check-sso',
          locale: this.languageService.currentLanguage(),
        })
        .then(
          (authenticated) => authenticated,
          (err) => {
            console.error('Keycloak initialization error', err);
            return false;
          },
        ),
    );
  }

  private changeProvider(
    keycloakProvider: KeycloakProvider,
  ): Observable<Keycloak> {
    localStorage.setItem(KEYCLOAK_PROVIDER, keycloakProvider?.id);
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
      this.providerId = keycloakProvider.id;
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
    this.providerId = null;
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
      localStorage.removeItem(KEYCLOAK_PROVIDER);
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
    this.userManagement.login(this.keycloak.token, this.providerId).subscribe();
  }
}
