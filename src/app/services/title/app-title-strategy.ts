import { Injectable, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Custom TitleStrategy to set the document title based on route configuration
 * and the currently selected language using ngx-translate.
 * Reads the title key directly from the `title` property of the route definition.
 */
@Injectable({
  providedIn: 'root',
})
export class AppTitleStrategy extends TitleStrategy implements OnDestroy {
  private readonly DEFAULT_TITLE_KEY = 'HOME';

  // Hardcoded fallback titles used if translation via ngx-translate fails.
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
      DATA_PROTECTION_DIALOG: 'Privacy Policy',
      DONATION_DIALOG: 'Help frag.jetzt Grow!',
      GPT_CHAT_ROOM: 'AI Chat Room',
      HOME: 'Where Questions Turn into Answers!',
      IMPRINT_DIALOG: 'Legal Notice',
      INTRODUCTION: 'How It Works',
      MODERATOR: 'Posts retained',
      MODERATOR_JOIN: 'Join as Moderator',
      NOT_FOUND: 'Page Not Found',
      PARTICIPANT: 'Q&A Session',
      PURCHASE: 'Payment Process',
      QUESTIONWALL: 'Question Wall',
      QUIZ: 'Quiz',
      ROOM: 'Room Entry',
      TAGCLOUD: 'Question Radar',
      TRANSACTION: 'Payment Details',
      UPDATE_INFO_DIALOG: 'Update Information',
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
      DATA_PROTECTION_DIALOG: 'Datenschutzrichtlinie',
      DONATION_DIALOG: 'Gestalte die Zukunft mit uns!',
      GPT_CHAT_ROOM: 'KI-Chatraum',
      HOME: 'Wo Fragen zu Antworten werden!',
      IMPRINT_DIALOG: 'Impressum',
      INTRODUCTION: 'So funktioniert es',
      MODERATOR: 'Zurückgehaltene Beiträge',
      MODERATOR_JOIN: 'Als Moderator beitreten',
      NOT_FOUND: 'Seite nicht gefunden',
      PARTICIPANT: 'Fragen & Antworten',
      PURCHASE: 'Zahlungsvorgang',
      QUESTIONWALL: 'Fragenwand',
      QUIZ: 'Quiz',
      ROOM: 'Empfang',
      TAGCLOUD: 'Fragenradar',
      TRANSACTION: 'Zahlungsdetails',
      UPDATE_INFO_DIALOG: 'Aktualisierungsinformation',
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
      DATA_PROTECTION_DIALOG: 'Politique de confidentialité',
      DONATION_DIALOG: "Faites une différence aujourd'hui!",
      GPT_CHAT_ROOM: 'Salle de chat IA',
      HOME: 'Où les questions deviennent des réponses !',
      IMPRINT_DIALOG: 'Mentions légales',
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
      UPDATE_INFO_DIALOG: 'Information de mise à jour',
      USER_DASHBOARD: 'Mes salles',
      USER_OVERVIEW: 'Mon profil',
    },
  };

  // Stores current title key and state
  private currentTitleKey: string | null = null;
  private originalTitle: string | null = null;
  private routeTitleKeyBeforeDialog: string | null = null;
  private readonly langChangeSubscription: Subscription;

  constructor(
    private readonly title: Title,
    private readonly translate: TranslateService,
  ) {
    super();
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      const keyToUpdate = this.currentTitleKey || this.DEFAULT_TITLE_KEY;
      this.updateTitleWithCurrentLanguage(keyToUpdate);
    });

    this.updateTitleWithCurrentLanguage(this.DEFAULT_TITLE_KEY);
  }

  /**
   * Updates the document title based on the router state.
   */
  override updateTitle(routerState: RouterStateSnapshot): void {
    let route = routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const titleKey = route.title ?? this.DEFAULT_TITLE_KEY;

    if (!this.originalTitle) {
      this.currentTitleKey = titleKey;
      this.updateTitleWithCurrentLanguage(titleKey);
    } else {
      this.routeTitleKeyBeforeDialog = titleKey;
    }
  }

  /**
   * Fetches the translation and sets the document title.
   */
  private updateTitleWithCurrentLanguage(titleKey: string): void {
    const currentLang =
      this.translate.currentLang || this.translate.defaultLang || 'en';
    const fallbackTitle = this.getFallbackTitle(titleKey, currentLang);
    const translationKey = `PAGE_TITLES.${titleKey}`;

    this.translate
      .get(translationKey)
      .pipe(
        catchError(() => {
          console.warn(
            `Translation not found for key: ${translationKey}. Using fallback or key.`,
          );
          return of(fallbackTitle || titleKey);
        }),
      )
      .subscribe((translatedTitle: string) => {
        const finalTitle =
          translatedTitle && translatedTitle !== translationKey
            ? translatedTitle
            : fallbackTitle || titleKey;

        this.title.setTitle(`${finalTitle} | frag.jetzt`);
      });
  }

  /**
   * Retrieves a hardcoded fallback title.
   */
  private getFallbackTitle(key: string, lang: string): string | null {
    if (this.fallbackTitles[lang]?.[key]) {
      return this.fallbackTitles[lang][key];
    }
    if (lang !== 'en' && this.fallbackTitles['en']?.[key]) {
      return this.fallbackTitles['en'][key];
    }
    return null;
  }

  /**
   * Temporarily sets the document title for a dialog.
   */
  setDialogTitle(dialogTitleKey: string): void {
    if (!this.originalTitle) {
      this.routeTitleKeyBeforeDialog = this.currentTitleKey;
      this.originalTitle = this.title.getTitle();
    }
    this.currentTitleKey = dialogTitleKey;
    this.updateTitleWithCurrentLanguage(dialogTitleKey);
  }

  /**
   * Restores the document title that was active before a dialog was opened.
   */
  restoreOriginalTitle(): void {
    if (this.originalTitle) {
      this.title.setTitle(this.originalTitle);
      this.currentTitleKey = this.routeTitleKeyBeforeDialog;
      this.originalTitle = null;
      this.routeTitleKeyBeforeDialog = null;

      if (this.currentTitleKey) {
        this.updateTitleWithCurrentLanguage(this.currentTitleKey);
      } else {
        this.updateTitleWithCurrentLanguage(this.DEFAULT_TITLE_KEY);
      }
    }
  }

  /**
   * Cleans up the subscription.
   */
  ngOnDestroy(): void {
    this.langChangeSubscription.unsubscribe();
  }
}
