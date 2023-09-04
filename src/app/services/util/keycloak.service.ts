import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { LanguageService } from './language.service';
import { BehaviorSubject, Observable, defer, from, of, switchMap } from 'rxjs';
import { KeycloakProviderService } from '../http/keycloak-provider.service';
import { KeycloakProvider } from 'app/models/keycloak-provider';
import { UserManagementService } from './user-management.service';
import { UUID } from 'app/utils/ts-utils';

const KEYCLOAK_PROVIDER = 'keycloak-provider-id';

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  private keycloak: Keycloak;
  private providerId: UUID;
  private providers = new BehaviorSubject<KeycloakProvider[]>([]);

  constructor(
    keycloakProvider: KeycloakProviderService,
    private languageService: LanguageService,
    private userManagement: UserManagementService,
  ) {
    const id = localStorage.getItem(KEYCLOAK_PROVIDER);
    keycloakProvider.getAll().subscribe((providers) => {
      this.providers.next(providers);
      if (id) {
        this.doKeycloakLogin(id as UUID, false).subscribe();
      }
    });
  }

  getProviders(): Observable<KeycloakProvider[]> {
    return this.providers;
  }

  redirectAccountManagement() {
    this.keycloak.accountManagement();
  }

  doKeycloakLogin(
    keycloakId: UUID,
    force: boolean = true,
  ): Observable<boolean> {
    let activeProvider = null;
    for (const provider of this.providers.value) {
      if (provider.nameDe.length < 1) {
        activeProvider = provider;
      }
      if (keycloakId === provider.id) {
        activeProvider = provider;
        break;
      }
    }
    return this.changeProvider(activeProvider).pipe(
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
        url: this.adjustURL(keycloakProvider.url),
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
    url = url.replace(
      /^(https?:\/\/)?fragjetzt-keycloak(:\d+)?/i,
      location.origin,
    );
    if (url.startsWith('/')) {
      return location.origin + '/' + url;
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'http://' + url;
    }
    return url;
  }

  private updateUser(keycloak: Keycloak) {
    if (this.keycloak !== keycloak) {
      return;
    }
    console.log(keycloak.tokenParsed);
    this.userManagement
      .login(this.keycloak.token, this.providerId)
      .subscribe((d) => console.log(d));
  }
}
