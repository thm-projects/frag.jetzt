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
  // Default key used when no title is specified
  private readonly DEFAULT_TITLE_KEY = 'HOME';

  // State tracking for current title and dialog handling
  private currentTitleKey: string = this.DEFAULT_TITLE_KEY;
  private routeTitleKeyBeforeDialog: string | null = null;
  private readonly langChangeSubscription: Subscription;

  // Hardcoded fallback titles used if translation via ngx-translate fails
  private readonly fallbackTitles: Record<string, Record<string, string>> = {
    en: {
      // Admin section
      ADMIN_CREATE_MOTD: 'Create Announcement',
      ADMIN_KEYCLOAK_PROVIDER: 'Keycloak Configuration',
      ADMIN_MAILING: 'Admin Mailing',
      ADMIN_OVERVIEW: 'Admin Overview',
      ADMIN_PORTAL: 'Admin Area',

      // Core features
      API_SETUP: 'API Configuration',
      BRAINSTORMING: 'Brainstorming',
      COMMENT: 'Post',
      COMMENTS: 'Public Posts',
      CONVERSATION: 'Post History',
      CREATOR: 'Room Management',
      HOME: 'Where Questions Turn into Answers!',
      INTRODUCTION: 'How It Works',
      MODERATOR: 'Posts retained',
      MODERATOR_JOIN: 'Join as Moderator',
      NOT_FOUND: 'Page Not Found',
      PARTICIPANT: 'Q&A Session',
      QUESTIONWALL: 'Question Wall',
      QUIZ: 'Quiz',
      ROOM: 'Room Entry',
      TAGCLOUD: 'Question Radar',

      // User and payment features
      GPT_CHAT_ROOM: 'AI Chat Room',
      PURCHASE: 'Payment Process',
      TRANSACTION: 'Payment Details',
      USER_DASHBOARD: 'My Rooms',
      USER_OVERVIEW: 'My Profile',

      // Dialog titles
      DATA_PROTECTION_DIALOG: 'Privacy Policy',
      DONATION_DIALOG: 'Help frag.jetzt Grow!',
      IMPRINT_DIALOG: 'Legal Notice',
      UPDATE_INFO_DIALOG: 'Update Information',
    },

    de: {
      // Same structure maintained for German titles
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
      // Same structure maintained for French titles
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

  constructor(
    private readonly title: Title,
    private readonly translate: TranslateService,
  ) {
    super();

    // Set up subscription to language changes to update title
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      this.updateTitleWithCurrentLanguage(this.currentTitleKey);
    });

    // Set initial default title
    this.updateTitleWithCurrentLanguage(this.DEFAULT_TITLE_KEY);
  }

  // ====== Router Integration ======

  /**
   * Updates the document title based on the router state.
   * This is called by Angular's router when navigation completes.
   */
  override updateTitle(routerState: RouterStateSnapshot): void {
    // Find the deepest route (leaf node)
    let route = routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    // Extract title key from route data or use default
    const titleKey = route.title ?? this.DEFAULT_TITLE_KEY;

    // Only update if no dialog is currently active
    if (!this.routeTitleKeyBeforeDialog) {
      this.currentTitleKey = titleKey;
      this.updateTitleWithCurrentLanguage(titleKey);
    }
  }

  // ====== Dialog Title Management ======

  /**
   * Temporarily sets the document title for a dialog.
   * Stores the previous title to be restored later.
   */
  setDialogTitle(dialogTitleKey: string): void {
    // Store current title key for later restoration if not already stored
    if (!this.routeTitleKeyBeforeDialog) {
      this.routeTitleKeyBeforeDialog = this.currentTitleKey;
    }

    // Update to dialog title
    this.currentTitleKey = dialogTitleKey;
    this.updateTitleWithCurrentLanguage(dialogTitleKey);
  }

  /**
   * Restores the document title to a default value.
   * Note: We use a default title for reliability across navigation contexts.
   */
  restoreOriginalTitle(): void {
    // Reset to default HOME title for consistency
    this.currentTitleKey = this.DEFAULT_TITLE_KEY;
    this.updateTitleWithCurrentLanguage(this.DEFAULT_TITLE_KEY);
    this.routeTitleKeyBeforeDialog = null;
  }

  // ====== Title Translation & Fallback Logic ======

  /**
   * Core method for setting the document title using the current language.
   * Implements a cascading fallback mechanism for missing translations.
   */
  private updateTitleWithCurrentLanguage(titleKey: string): void {
    // Get current language or fall back to default
    const currentLang =
      this.translate.currentLang || this.translate.defaultLang || 'en';

    // Format the translation key
    const translationKey = `PAGE_TITLES.${titleKey}`;

    // Try to get translation from the service
    this.translate
      .get(translationKey)
      .pipe(
        catchError(() => {
          // Handle errors from translate service
          return of(translationKey);
        }),
      )
      .subscribe((translatedTitle: string) => {
        let finalTitle: string;

        // Check if translation was found
        if (translatedTitle === translationKey) {
          // FALLBACK 1: Try hardcoded fallbacks in current language
          if (this.fallbackTitles[currentLang]?.[titleKey]) {
            finalTitle = this.fallbackTitles[currentLang][titleKey];
          }
          // FALLBACK 2: Try English fallbacks if not already in English
          else if (
            currentLang !== 'en' &&
            this.fallbackTitles['en']?.[titleKey]
          ) {
            finalTitle = this.fallbackTitles['en'][titleKey];
          }
          // FALLBACK 3: Use the key itself as last resort
          else {
            finalTitle = titleKey;
          }
        } else {
          // Translation found - use it
          finalTitle = translatedTitle;
        }

        // Set the browser title with site suffix
        this.title.setTitle(`${finalTitle} | frag.jetzt`);
      });
  }

  // ====== Lifecycle ======

  /**
   * Clean up resources when component is destroyed
   */
  ngOnDestroy(): void {
    this.langChangeSubscription.unsubscribe();
  }
}
