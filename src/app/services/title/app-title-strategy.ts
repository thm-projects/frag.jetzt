import { Injectable, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Custom TitleStrategy for internationalized page titles using fallback translations.
 */
@Injectable()
export class AppTitleStrategy extends TitleStrategy implements OnDestroy {
  // Fallback translations (alphabetically sorted)
  private readonly fallbackTitles: Record<string, Record<string, string>> = {
    en: {
      ADMIN_CREATE_MOTD: 'MOTD Creation',
      ADMIN_KEYCLOAK_PROVIDER: 'Keycloak Provider',
      ADMIN_MAILING: 'Admin Mailing',
      ADMIN_OVERVIEW: 'Admin Overview',
      ADMIN_PORTAL: 'Admin Area',
      API_SETUP: 'API Settings',
      BRAINSTORMING: 'Brainstorming',
      COMMENT: 'Post',
      COMMENTS: 'Public Posts',
      CONVERSATION: 'Post History',
      CREATOR: 'Room Management',
      DATA_PROTECTION: 'Data Protection',
      GPT_CHAT_ROOM: 'GPT Chat Room',
      HOME: 'Home',
      IMPRINT: 'Legal Notice',
      INTRODUCTION: 'Introduction',
      MODERATOR: 'Moderator Posts',
      MODERATOR_JOIN: 'Join as Moderator',
      NOT_FOUND: 'Page Not Found',
      PARTICIPANT: 'Q&A',
      PURCHASE: 'Payment Process',
      QUESTIONWALL: 'Question Wall',
      QUIZ: 'Quiz',
      ROOM: 'Room Entrance',
      TAGCLOUD: 'Tag Cloud',
      TRANSACTION: 'Payment Details',
      USER_DASHBOARD: 'My Rooms',
      USER_OVERVIEW: 'My Profile',
    },
    de: {
      ADMIN_CREATE_MOTD: 'MOTD-Erstellung',
      ADMIN_KEYCLOAK_PROVIDER: 'Keycloak-Provider',
      ADMIN_MAILING: 'Admin-Mailing',
      ADMIN_OVERVIEW: 'Admin-Übersicht',
      ADMIN_PORTAL: 'Admin-Bereich',
      API_SETUP: 'API-Einstellungen',
      BRAINSTORMING: 'Brainstorming',
      COMMENT: 'Beitrag',
      COMMENTS: 'Öffentliche Beiträge',
      CONVERSATION: 'Beitragsverlauf',
      CREATOR: 'Raumverwaltung',
      DATA_PROTECTION: 'Datenschutz',
      GPT_CHAT_ROOM: 'Mit der KI chatten',
      HOME: 'Startseite',
      IMPRINT: 'Impressum',
      INTRODUCTION: 'Einführung',
      MODERATOR: 'Zurückhehaltende Beiträge',
      MODERATOR_JOIN: 'Als Moderator:in beitreten',
      NOT_FOUND: 'Diese Seite existiert nicht',
      PARTICIPANT: 'Q&A',
      PURCHASE: 'Bezahlvorgang',
      QUESTIONWALL: 'Fragenwand',
      QUIZ: 'Quiz',
      ROOM: 'Raumeingang',
      TAGCLOUD: 'Fragenradar',
      TRANSACTION: 'Zahlungsdetails',
      USER_DASHBOARD: 'Meine Räume',
      USER_OVERVIEW: 'Mein Profil',
    },
    fr: {
      ADMIN_CREATE_MOTD: 'Création de MOTD',
      ADMIN_KEYCLOAK_PROVIDER: 'Fournisseur Keycloak',
      ADMIN_MAILING: 'Mailing Admin',
      ADMIN_OVERVIEW: 'Vue d’administration',
      ADMIN_PORTAL: 'Espace Admin',
      API_SETUP: 'Paramètres API',
      BRAINSTORMING: 'Brainstorming',
      COMMENT: 'Publication',
      COMMENTS: 'Publications',
      CONVERSATION: 'Historique des publications',
      CREATOR: 'Gestion des salles',
      DATA_PROTECTION: 'Protection des données',
      GPT_CHAT_ROOM: 'Salle de chat GPT',
      HOME: 'Accueil',
      IMPRINT: 'Mentions légales',
      INTRODUCTION: 'Introduction',
      MODERATOR: 'Publications à modérer',
      MODERATOR_JOIN: 'Rejoindre en tant que modérateur',
      NOT_FOUND: 'Page introuvable',
      PARTICIPANT: 'Q&R',
      PURCHASE: 'Processus de paiement',
      QUESTIONWALL: 'Mur de questions',
      QUIZ: 'Quiz',
      ROOM: 'Entrée de salle',
      TAGCLOUD: 'Nuage de tags',
      TRANSACTION: 'Détails de paiement',
      USER_DASHBOARD: 'Mes salles',
      USER_OVERVIEW: 'Mon profil',
    },
  };

  private currentTitle: string | null = null;
  private langChangeSubscription: Subscription;

  constructor(
    private readonly title: Title,
    private readonly translate: TranslateService,
  ) {
    super();
    // Subscribe to language change events to update the title accordingly
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      if (this.currentTitle) {
        this.updateTitleWithCurrentLanguage(this.currentTitle);
      }
    });
  }

  // Called by the router when the page title should be updated.
  // Note: Title keys for lazy-loaded modules are provided via the "title" property in their routing definitions.
  override updateTitle(routerState: RouterStateSnapshot): void {
    const titleKey = this.buildTitle(routerState);
    this.currentTitle = titleKey as string;
    if (titleKey) {
      this.updateTitleWithCurrentLanguage(titleKey as string);
    } else {
      // Fallback title if no key is provided
      this.title.setTitle('frag.jetzt');
    }
  }

  // Update the browser title based on the current language.
  // This method attempts to retrieve a translated title first (using TranslateService),
  // but falls back to a predefined translation if needed. It also handles lazy-loaded modules'
  // title keys provided in the routing modules.
  private updateTitleWithCurrentLanguage(titleKey: string): void {
    const currentLang =
      this.translate.currentLang || this.translate.defaultLang || 'en';
    const fallbackTitle = this.getFallbackTitle(titleKey, currentLang);
    if (fallbackTitle) {
      this.title.setTitle(`${fallbackTitle} | frag.jetzt`);
    } else {
      this.title.setTitle(`${titleKey} | frag.jetzt`);
    }
    this.translate
      .get(`PAGE_TITLES.${titleKey}`)
      .pipe(
        catchError((err) => {
          console.error(`Error loading translation for key ${titleKey}:`, err);
          return of(''); // Return an empty string on error
        }),
      )
      .subscribe((translatedTitle: string) => {
        // Use the translated title if available and different than the key
        if (translatedTitle && translatedTitle !== `PAGE_TITLES.${titleKey}`) {
          this.title.setTitle(`${translatedTitle} | frag.jetzt`);
        }
      });
  }

  // Retrieve the fallback translation for a given key and language.
  // If not found, fall back to English.
  private getFallbackTitle(key: string, lang: string): string | null {
    if (this.fallbackTitles[lang] && this.fallbackTitles[lang][key]) {
      return this.fallbackTitles[lang][key];
    }
    if (
      lang !== 'en' &&
      this.fallbackTitles['en'] &&
      this.fallbackTitles['en'][key]
    ) {
      return this.fallbackTitles['en'][key];
    }
    return null;
  }

  // Unsubscribe from language change events when the instance is destroyed.
  ngOnDestroy(): void {
    this.langChangeSubscription.unsubscribe();
  }
}
