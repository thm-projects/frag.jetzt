import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

/**
 * Custom TitleStrategy that handles internationalization of page titles.
 * Uses fallback translations for critical routes to ensure titles are always available,
 * even when translation loading fails or is delayed.
 */
@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  // Hardcoded fallback translations for all routes
  private readonly fallbackTitles: Record<string, Record<string, string>> = {
    en: {
      HOME: 'Home',
      USER_DASHBOARD: 'My Dashboard',
      USER_OVERVIEW: 'My Profile',
      API_SETUP: 'API Settings',
      IMPRINT: 'Legal Notice',
      INTRODUCTION: 'How It Works',
      DATA_PROTECTION: 'Privacy Policy',
      QUIZ: 'Take Quiz',
      PURCHASE: 'Checkout',
      TRANSACTION: 'Payment Details',
      ADMIN_PORTAL: 'Admin Area',
      CREATOR: 'Room Management',
      PARTICIPANT: 'Q&A Session',
      MODERATOR: 'Moderation Tools',
      NOT_FOUND: 'Page Not Found',
    },
    de: {
      HOME: 'Startseite',
      USER_DASHBOARD: 'Meine Übersicht',
      USER_OVERVIEW: 'Mein Profil',
      API_SETUP: 'API-Einstellungen',
      IMPRINT: 'Impressum',
      INTRODUCTION: 'So funktioniert es',
      DATA_PROTECTION: 'Datenschutz',
      QUIZ: 'Quiz machen',
      PURCHASE: 'Zur Kasse',
      TRANSACTION: 'Zahlungsdetails',
      ADMIN_PORTAL: 'Admin-Bereich',
      CREATOR: 'Raumverwaltung',
      PARTICIPANT: 'Fragen & Antworten',
      MODERATOR: 'Moderationstools',
      NOT_FOUND: 'Seite nicht gefunden',
    },
    fr: {
      HOME: 'Accueil',
      USER_DASHBOARD: 'Mon tableau de bord',
      USER_OVERVIEW: 'Mon profil',
      API_SETUP: 'Paramètres API',
      IMPRINT: 'Mentions légales',
      INTRODUCTION: 'Comment ça marche',
      DATA_PROTECTION: 'Confidentialité',
      QUIZ: 'Faire le quiz',
      PURCHASE: 'Paiement',
      TRANSACTION: 'Détails du paiement',
      ADMIN_PORTAL: 'Espace admin',
      CREATOR: 'Gestion des salles',
      PARTICIPANT: 'Questions & Réponses',
      MODERATOR: 'Outils de modération',
      NOT_FOUND: 'Page introuvable',
    },
  };

  private currentTitle: string | null = null;
  private langChangeSubscription: Subscription;

  constructor(
    private readonly title: Title,
    private readonly translate: TranslateService,
  ) {
    super();

    // Subscribe to language changes to update the title reactively
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      if (this.currentTitle) {
        this.updateTitleWithCurrentLanguage(this.currentTitle);
      }
    });
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const titleKey = this.buildTitle(routerState);
    this.currentTitle = titleKey as string;

    if (titleKey) {
      this.updateTitleWithCurrentLanguage(titleKey as string);
    } else {
      this.title.setTitle('frag.jetzt');
    }
  }

  private updateTitleWithCurrentLanguage(titleKey: string): void {
    // Get current language
    const currentLang =
      this.translate.currentLang || this.translate.defaultLang || 'en';

    // Try to get from fallback translations first
    const fallbackTitle = this.getFallbackTitle(titleKey, currentLang);

    if (fallbackTitle) {
      this.title.setTitle(`${fallbackTitle} | frag.jetzt`);
    } else {
      // Use key as fallback
      this.title.setTitle(`${titleKey} | frag.jetzt`);
    }

    // Try with TranslateService too
    this.translate
      .get(`PAGE_TITLES.${titleKey}`)
      .subscribe((translatedTitle: string) => {
        // Only use if it's not just returning the key
        if (translatedTitle && translatedTitle !== `PAGE_TITLES.${titleKey}`) {
          this.title.setTitle(`${translatedTitle} | frag.jetzt`);
        }
      });
  }

  private getFallbackTitle(key: string, lang: string): string | null {
    if (this.fallbackTitles[lang] && this.fallbackTitles[lang][key]) {
      return this.fallbackTitles[lang][key];
    }
    // Try English as ultimate fallback
    if (
      lang !== 'en' &&
      this.fallbackTitles['en'] &&
      this.fallbackTitles['en'][key]
    ) {
      return this.fallbackTitles['en'][key];
    }
    return null;
  }
}
