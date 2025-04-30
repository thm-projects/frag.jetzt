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
      ADMIN_CREATE_MOTD: 'Create Announcement',
      ADMIN_KEYCLOAK_PROVIDER: 'Keycloak Configuration',
      ADMIN_MAILING: 'Admin Mailing',
      ADMIN_OVERVIEW: 'Admin Overview',
      ADMIN_PORTAL: 'Admin Area',
      API_SETUP: 'API Configuration',
      BRAINSTORMING: 'Brainstorming',
      COMMENT: 'Post',
      COMMENTS: 'Public Posts',
      CONVERSATION: 'Post History',
      CREATOR: 'Room Management',
      DATA_PROTECTION: 'Privacy Policy',
      GPT_CHAT_ROOM: 'AI Chat Room',
      HOME: 'Home',
      IMPRINT: 'Legal Notice',
      INTRODUCTION: 'How It Works',
      MODERATOR: 'Held Back Posts',
      MODERATOR_JOIN: 'Join as Moderator',
      NOT_FOUND: 'Page Not Found',
      PARTICIPANT: 'Q&A Session',
      PURCHASE: 'Payment Process',
      QUESTIONWALL: 'Question Wall',
      QUIZ: 'Quiz',
      ROOM: 'Room Entry',
      TAGCLOUD: 'Question Radar',
      TRANSACTION: 'Payment Details',
      USER_DASHBOARD: 'My Rooms',
      USER_OVERVIEW: 'My Profile',
    },
    de: {
      ADMIN_CREATE_MOTD: 'Ankündigung erstellen',
      ADMIN_KEYCLOAK_PROVIDER: 'Keycloak-Konfiguration',
      ADMIN_MAILING: 'Admin-Mailing',
      ADMIN_OVERVIEW: 'Admin-Übersicht',
      ADMIN_PORTAL: 'Admin-Bereich',
      API_SETUP: 'API-Konfiguration',
      BRAINSTORMING: 'Brainstorming',
      COMMENT: 'Beitrag',
      COMMENTS: 'Öffentliche Beiträge',
      CONVERSATION: 'Beitragsverlauf',
      CREATOR: 'Raumverwaltung',
      DATA_PROTECTION: 'Datenschutzrichtlinie',
      GPT_CHAT_ROOM: 'KI-Chatraum',
      HOME: 'Startseite',
      IMPRINT: 'Impressum',
      INTRODUCTION: 'So funktioniert es',
      MODERATOR: 'Zurückbehaltende Beiträge',
      MODERATOR_JOIN: 'Als Moderator beitreten',
      NOT_FOUND: 'Seite nicht gefunden',
      PARTICIPANT: 'Fragen & Antworten',
      PURCHASE: 'Zahlungsvorgang',
      QUESTIONWALL: 'Fragenwand',
      QUIZ: 'Quiz',
      ROOM: 'Empfang',
      TAGCLOUD: 'Fragenradar',
      TRANSACTION: 'Zahlungsdetails',
      USER_DASHBOARD: 'Meine Räume',
      USER_OVERVIEW: 'Mein Profil',
    },
    fr: {
      ADMIN_CREATE_MOTD: 'Créer une annonce',
      ADMIN_KEYCLOAK_PROVIDER: 'Configuration Keycloak',
      ADMIN_MAILING: 'Mailing Admin',
      ADMIN_OVERVIEW: 'Tableau de bord Admin',
      ADMIN_PORTAL: 'Espace Admin',
      API_SETUP: 'Configuration API',
      BRAINSTORMING: 'Brainstorming',
      COMMENT: 'Publication',
      COMMENTS: 'Publications',
      CONVERSATION: 'Historique des publications',
      CREATOR: 'Gestion des salles',
      DATA_PROTECTION: 'Politique de confidentialité',
      GPT_CHAT_ROOM: 'Salle de chat IA',
      HOME: 'Accueil',
      IMPRINT: 'Mentions légales',
      INTRODUCTION: 'Comment ça marche',
      MODERATOR: 'Publications retenues',
      MODERATOR_JOIN: 'Rejoindre comme modérateur',
      NOT_FOUND: 'Page introuvable',
      PARTICIPANT: 'Questions & Réponses',
      PURCHASE: 'Processus de paiement',
      QUESTIONWALL: 'Mur de questions',
      QUIZ: 'Quiz',
      ROOM: 'Accueil',
      TAGCLOUD: 'Radar de questions',
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
