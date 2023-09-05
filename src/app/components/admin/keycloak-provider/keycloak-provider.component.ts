import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { KeycloakProvider } from 'app/models/keycloak-provider';
import {
  KeycloakProviderAPI,
  KeycloakProviderService,
} from 'app/services/http/keycloak-provider.service';
import { KeycloakService } from 'app/services/util/keycloak.service';
import {
  AVAILABLE_LANGUAGES,
  LanguageService,
} from 'app/services/util/language.service';
import { NotificationService } from 'app/services/util/notification.service';
import { Subject, take, takeUntil } from 'rxjs';

@Component({
  selector: 'app-keycloak-provider',
  templateUrl: './keycloak-provider.component.html',
  styleUrls: ['./keycloak-provider.component.scss'],
})
export class KeycloakProviderComponent implements OnInit, OnDestroy {
  readonly languages = AVAILABLE_LANGUAGES;
  readonly prettifyProvider = this.formatProvider.bind(this);
  id: string = '';
  names = new Array<string>(this.languages.length).fill('');
  descriptions = new Array<string>(this.languages.length).fill('');
  clientId: string = '';
  realm: string = '';
  url: string = '';
  frontendUrl: string = '';
  eventPassword: string = '';
  priority: number = 0;
  selectedProvider: KeycloakProvider;
  providers: KeycloakProvider[] = [];
  private destroyer = new Subject();

  constructor(
    private languageService: LanguageService,
    private notification: NotificationService,
    private translateService: TranslateService,
    private keyclaokService: KeycloakService,
    private providerService: KeycloakProviderService,
  ) {}

  ngOnInit(): void {
    this.keyclaokService.providers$
      .pipe(take(1), takeUntil(this.destroyer))
      .subscribe({
        next: (d) => (this.providers = d),
        error: () => this.showError(),
      });
  }

  ngOnDestroy(): void {
    this.destroyer.next(true);
    this.destroyer.complete();
  }

  saveProvider() {
    if (this.selectedProvider) {
      this.patchProvider();
      return;
    }
    const newProvider: KeycloakProviderAPI = {
      clientId: this.clientId,
      url: this.url,
      frontendUrl: this.frontendUrl,
      priority: this.priority,
      realm: this.realm,
      eventPassword: this.eventPassword,
      descriptionDe: 'n/a',
      descriptionEn: 'n/a',
      descriptionFr: 'n/a',
      nameDe: 'n/a',
      nameEn: 'n/a',
      nameFr: 'n/a',
    };
    this.languages.forEach((lang, index) => {
      const access = lang[0].toUpperCase() + lang.slice(1);
      newProvider['name' + access] = this.names[index];
      newProvider['description' + access] = this.descriptions[index];
    });
    this.providerService.create(newProvider).subscribe({
      next: (provider) => {
        this.providers.push(provider);
        this.selectedProvider = provider;
        this.onSelect();
        this.translateService.get('keycloak-provider.saved').subscribe((msg) =>
          this.notification.show(msg, undefined, {
            duration: 5000,
            panelClass: ['snackbar-valid'],
          }),
        );
      },
      error: () => this.showError(),
    });
  }

  deleteProvider() {
    this.providerService.delete(this.selectedProvider.id).subscribe({
      next: () => {
        this.providers.splice(this.providers.indexOf(this.selectedProvider), 1);
        this.selectedProvider = null;
        this.onSelect();
        this.translateService
          .get('keycloak-provider.deleted')
          .subscribe((msg) =>
            this.notification.show(msg, undefined, {
              duration: 5000,
              panelClass: ['snackbar-valid'],
            }),
          );
      },
      error: () => this.showError(),
    });
  }

  isDefault() {
    return !this.selectedProvider.nameDe;
  }

  canSave() {
    const isDefault = this.selectedProvider && this.isDefault();
    return (
      this.url &&
      this.priority !== null &&
      this.realm &&
      this.clientId &&
      (isDefault ||
        (this.names.every((n) => n) && this.descriptions.every((d) => d)))
    );
  }

  onSelect() {
    this.keyclaokService.update();
    for (let i = 0; i < this.languages.length; i++) {
      const lang = this.languages[i];
      const access = lang[0].toUpperCase() + lang.slice(1);
      this.names[i] = this.selectedProvider?.['name' + access] || '';
      this.descriptions[i] =
        this.selectedProvider?.['description' + access] || '';
    }
    this.id = this.selectedProvider?.id || '';
    this.clientId = this.selectedProvider?.clientId || '';
    this.url = this.selectedProvider?.url || '';
    this.frontendUrl = this.selectedProvider?.frontendUrl || '';
    this.priority = this.selectedProvider?.priority || 0;
    this.realm = this.selectedProvider?.realm || '';
    this.eventPassword = this.selectedProvider?.eventPassword || '';
  }

  private patchProvider() {
    const newProvider: Partial<KeycloakProviderAPI> = {};
    if (this.selectedProvider.clientId !== this.clientId) {
      newProvider.clientId = this.clientId;
    }
    if (this.selectedProvider.url !== this.url) {
      newProvider.url = this.url;
    }
    if (this.selectedProvider.frontendUrl !== this.frontendUrl) {
      newProvider.frontendUrl = this.frontendUrl;
    }
    if (this.selectedProvider.priority !== this.priority) {
      newProvider.priority = this.priority;
    }
    if (this.selectedProvider.realm !== this.realm) {
      newProvider.realm = this.realm;
    }
    if (this.selectedProvider.eventPassword !== this.eventPassword) {
      newProvider.eventPassword = this.eventPassword;
    }
    this.languages.forEach((lang, index) => {
      const access = lang[0].toUpperCase() + lang.slice(1);
      if (this.selectedProvider['name' + access] !== this.names[index]) {
        newProvider['name' + access] = this.names[index];
      }
      if (this.selectedProvider['description' + access] !== this.names[index]) {
        newProvider['description' + access] = this.names[index];
      }
    });
    if (Object.keys(newProvider).length < 1) {
      this.translateService
        .get('keycloak-provider.no-changes')
        .subscribe((msg) =>
          this.notification.show(msg, undefined, {
            duration: 5000,
            panelClass: ['snackbar-warn'],
          }),
        );
      return;
    }
    this.providerService
      .patch(this.selectedProvider.id, newProvider)
      .subscribe({
        next: (d) => {
          const index = this.providers.indexOf(this.selectedProvider);
          this.providers[index] = d;
          this.selectedProvider = d;
          this.onSelect();
          this.translateService
            .get('keycloak-provider.saved')
            .subscribe((msg) =>
              this.notification.show(msg, undefined, {
                duration: 5000,
                panelClass: ['snackbar-valid'],
              }),
            );
        },
        error: () => this.showError(),
      });
  }

  private showError() {
    this.translateService
      .get('keycloak-provider.something-went-wrong')
      .subscribe((msg) =>
        this.notification.show(msg, undefined, {
          duration: 12_500,
          panelClass: ['snackbar', 'important'],
        }),
      );
  }

  private formatProvider(provider: any) {
    const lang = this.languageService.currentLanguage() || 'en';
    const access = 'name' + lang[0].toUpperCase() + lang.slice(1);
    if (!provider) {
      return '';
    }
    let str = provider[access];
    if (!str) {
      str = 'Default';
    }
    return str;
  }
}
