import { Injectable, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AppTitleStrategy extends TitleStrategy implements OnDestroy {
  // Define a default title key (e.g., for the home page or initial load)
  private readonly DEFAULT_TITLE_KEY = 'HOME';

  // Fallback translation keys for titles in different languages
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

  // Store the *key* of the current title (route or dialog)
  private currentTitleKey: string | null = null;
  private originalTitle: string | null = null;
  private readonly langChangeSubscription: Subscription;

  constructor(
    private readonly title: Title,
    private readonly translate: TranslateService,
  ) {
    super();
    // Subscribe to language change events to update titles accordingly
    this.langChangeSubscription = this.translate.onLangChange.subscribe(() => {
      // Use the stored key to update the title when language changes
      const keyToUpdate = this.currentTitleKey || this.DEFAULT_TITLE_KEY;
      this.updateTitleWithCurrentLanguage(keyToUpdate);
    });

    // Set initial title based on default language and default key
    this.updateTitleWithCurrentLanguage(this.DEFAULT_TITLE_KEY);
  }

  // Update the routing title based on the router state data
  override updateTitle(routerState: RouterStateSnapshot): void {
    // Use the default key if no title is found in route data
    const titleKey =
      routerState.root.firstChild?.data['title'] ?? this.DEFAULT_TITLE_KEY;
    this.currentTitleKey = titleKey; // Store the key for language change updates
    this.updateTitleWithCurrentLanguage(titleKey);
  }

  // Update the title using the current language, ngx-translate, and fallback keys
  private updateTitleWithCurrentLanguage(titleKey: string): void {
    const currentLang =
      this.translate.currentLang || this.translate.defaultLang || 'en';
    const fallbackTitle = this.getFallbackTitle(titleKey, currentLang);
    const translationKey = `PAGE_TITLES.${titleKey}`;

    this.translate
      .get(translationKey)
      .pipe(
        catchError(() => {
          // On error (e.g., key not found in JSON), use fallback or the key itself
          console.warn(
            `Translation not found for key: ${translationKey}. Using fallback or key.`,
          );
          return of(fallbackTitle || titleKey);
        }),
      )
      .subscribe((translatedTitle: string) => {
        // Check if translation is valid and not just the key path itself
        const finalTitle =
          translatedTitle && translatedTitle !== translationKey
            ? translatedTitle
            : fallbackTitle || titleKey; // Use fallback or key if translation failed or was invalid

        this.title.setTitle(`${finalTitle} | frag.jetzt`);
      });
  }

  // Retrieve a fallback title for a given key and language
  private getFallbackTitle(key: string, lang: string): string | null {
    if (this.fallbackTitles[lang]?.[key]) {
      return this.fallbackTitles[lang][key];
    }
    // Fallback to English if key exists there but not in current language
    if (lang !== 'en' && this.fallbackTitles['en']?.[key]) {
      return this.fallbackTitles['en'][key];
    }
    return null;
  }

  // Set the dialog title and save the current title for later restoration
  setDialogTitle(dialogTitleKey: string): void {
    if (!this.originalTitle) {
      this.originalTitle = this.title.getTitle();
    }
    // Store the dialog key temporarily while the dialog is open
    // This allows language changes to update the dialog title
    this.currentTitleKey = dialogTitleKey;
    this.updateTitleWithCurrentLanguage(dialogTitleKey);
  }

  // Restore the original title saved before opening a dialog
  restoreOriginalTitle(): void {
    if (this.originalTitle) {
      this.title.setTitle(this.originalTitle);
      this.originalTitle = null;
      // Reset currentTitleKey so the next route change or lang change uses the correct route title
      // We assume a navigation event will happen shortly after closing a dialog,
      // or the user is back on a page whose title will be set by updateTitle.
      // If not, we might need to re-fetch the current route's title here.
      this.currentTitleKey = null; // Resetting might be simplest. Re-evaluate if needed.
    }
  }

  // Unsubscribe from language change events when the service is destroyed
  ngOnDestroy(): void {
    this.langChangeSubscription.unsubscribe();
  }
}
