import { Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { DataProtectionComponent } from 'app/components/home/_dialogs/data-protection/data-protection.component';
import { DemoVideoComponent } from 'app/components/home/_dialogs/demo-video/demo-video.component';
import { ImprintComponent } from 'app/components/home/_dialogs/imprint/imprint.component';
import { UserBonusTokenComponent } from 'app/components/participant/_dialogs/user-bonus-token/user-bonus-token.component';
import { GptOptInPrivacyComponent } from 'app/components/shared/_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { AppRatingComponent } from 'app/components/shared/app-rating/app-rating.component';
import { KeycloakRoles, User } from 'app/models/user';
import { RatingService } from 'app/services/http/rating.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { KeycloakService } from 'app/services/util/keycloak.service';
import { OnboardingService } from 'app/services/util/onboarding.service';
import { HEADER, NAVIGATION } from 'modules/navigation/m3-navigation-emitter';
import {
  M3HeaderOption,
  M3HeaderTemplate,
  M3NavigationOptionSection,
  M3NavigationSection,
  M3NavigationTemplate,
} from 'modules/navigation/m3-navigation.types';
import { Observable, combineLatest, first, map, startWith } from 'rxjs';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AVAILABLE_LANGUAGES,
  language,
  setLanguage,
} from 'app/base/language/language';
import { setTheme, theme } from 'app/base/theme/theme';

import i18nRaw from './default-navigation.i18n.json';
const i18n = I18nLoader.loadModule(i18nRaw);

export const applyDefaultNavigation = (
  injector: Injector,
): Observable<void> => {
  return combineLatest([
    getDefaultHeader(injector),
    getDefaultNavigation(injector),
  ]).pipe(
    map(([header, navigation]) => {
      HEADER.set(header);
      NAVIGATION.set(navigation);
    }),
  );
};

export const getDefaultHeader = (
  injector: Injector,
): Observable<M3HeaderTemplate> => {
  const accountState = injector.get(AccountStateService);
  const router = injector.get(Router);
  const dialog = injector.get(MatDialog);
  const keycloak = injector.get(KeycloakService);
  return combineLatest([
    accountState.user$,
    toObservable(i18n),
    toObservable(theme),
  ]).pipe(
    map(([user, i18n, theme]) => {
      return {
        slogan: 'Du fragst. ChatGPT antwortet.',
        options: [
          user
            ? {
                icon: 'account_circle',
                title: i18n.header.myAccount,
                items: [
                  {
                    icon: 'grade',
                    title: i18n.header.myStars,
                    onClick: () => {
                      UserBonusTokenComponent.openDialog(dialog, user.id);
                    },
                  },
                  {
                    icon: 'policy',
                    title: i18n.header.aiConsent,
                    onClick: () => {
                      openAIConsent(injector);
                    },
                  },
                  {
                    svgIcon: 'fj_robot',
                    title: i18n.header.myAiPrompts,
                    onClick: () => {
                      router.navigate(['/gpt-prompts']);
                    },
                  },
                  {
                    icon: 'manage_accounts',
                    title: i18n.header.manageAccount,
                    onClick: () => {
                      keycloak.redirectAccountManagement();
                    },
                  },
                  {
                    icon: 'person_remove',
                    title: i18n.header.deleteAccount,
                    onClick: () => {
                      keycloak.deleteAccount();
                    },
                  },
                  {
                    icon: 'logout',
                    title: i18n.header.logout,
                    onClick: () => accountState.logout().subscribe(),
                  },
                ],
              }
            : {
                icon: 'login',
                title: i18n.header.login,
                onClick: () => accountState.openLogin().subscribe(),
              },
          {
            icon: 'language',
            title: i18n.header.language,
            items: AVAILABLE_LANGUAGES.map(
              (lang) =>
                ({
                  icon: language() === lang ? 'check' : 'flag',
                  title: i18n.header.languages[lang],
                  disabled: language() === lang,
                  onClick: () => setLanguage(lang),
                }) as M3HeaderOption,
            ),
          },
          {
            icon: 'settings_brightness',
            title: i18n.header.theme,
            items: [
              {
                icon: theme === 'light' ? 'check' : 'light_mode',
                disabled: theme === 'light',
                title: i18n.header.light,
                onClick: () => setTheme('light'),
              },
              {
                icon: theme === 'dark' ? 'check' : 'dark_mode',
                disabled: theme === 'dark',
                title: i18n.header.dark,
                onClick: () => setTheme('dark'),
              },
              {
                icon: theme === 'system' ? 'check' : 'nights_stay',
                disabled: theme === 'system',
                title: i18n.header.system,
                onClick: () => setTheme('system'),
              },
            ],
          },
        ],
      };
    }),
  );
};

export const getDefaultNavigation = (
  injector: Injector,
): Observable<M3NavigationTemplate> => {
  const accountState = injector.get(AccountStateService);
  const router = injector.get(Router);
  return combineLatest([
    accountState.user$,
    router.events.pipe(
      first((e) => e instanceof NavigationEnd),
      startWith({}),
    ),
    toObservable(i18n),
  ]).pipe(
    map(([user, , i18n]) => {
      // NAVIGATION
      const isHome = router.url.startsWith('/home');
      const isUser = router.url.startsWith('/user');
      const navSection: M3NavigationSection = {
        id: 'main',
        kind: 'navigation',
        title: i18n.navigation.app,
        entries: [],
      };
      if (user) {
        navSection.entries.push({
          id: 'my-rooms',
          title: i18n.navigation.myRooms,
          icon: 'person',
          onClick: () => {
            router.navigate(['/user']);
            return true;
          },
          activated: isUser,
        });
      }
      if (isHome || isUser) {
        navSection.entries.unshift({
          id: 'home',
          title: i18n.navigation.home,
          icon: 'home',
          onClick: () => {
            router.navigate(['/home']);
            return true;
          },
          activated: isHome,
        });
      } else {
        navSection.entries.push({
          id: 'home',
          title: i18n.navigation.home,
          icon: 'home',
          onClick: () => {
            router.navigate(['/home']);
            return true;
          },
          activated: isHome,
        });
      }
      if (user?.hasRole(KeycloakRoles.AdminDashboard)) {
        navSection.entries.push({
          id: 'admin',
          title: i18n.navigation.admin,
          icon: 'admin_panel_settings',
          onClick: () => {
            router.navigate(['/admin/overview']);
            return true;
          },
        });
      }
      // OPTIONS
      const optionSection: M3NavigationOptionSection = {
        id: 'about',
        kind: 'options',
        title: i18n.options.about,
        options: [
          {
            id: 'intro',
            title: i18n.options.introTitle,
            icon: 'summarize',
            options: [
              {
                id: 'demo',
                title: i18n.options.intro,
                icon: 'summarize',
                onClick: () => {
                  showDemo(injector);
                  return false;
                },
              },
              {
                id: 'tour',
                icon: 'flag',
                title: i18n.options.tour,
                onClick: () => {
                  startTour(injector);
                  return false;
                },
              },
            ],
          },
          {
            id: 'feedback',
            title: i18n.options.feedbackTitle,
            icon: 'rate_review',
            options: [
              {
                id: 'feedback-room',
                icon: 'rate_review',
                title: i18n.options.feedbackRoom,
                onClick: () => {
                  open(
                    'https://frag.jetzt/participant/room/Feedback',
                    '_blank',
                  );
                  return true;
                },
              },
              {
                id: 'rate-app',
                icon: 'grade',
                title: i18n.options.rateApp,
                onClick: () => {
                  openRateApp(user, injector);
                  return false;
                },
              },
            ],
          },
          user && {
            id: 'news',
            icon: 'campaign',
            title: i18n.options.news,
            onClick: () => {
              showNews(injector);
              return false;
            },
          },
          {
            id: 'privacy',
            icon: 'security',
            title: i18n.options.dataProtection,
            onClick: () => {
              showGDPR(injector);
              return false;
            },
          },
          {
            id: 'imprint',
            icon: 'privacy_tip',
            title: i18n.options.imprint,
            onClick: () => {
              showImprint(injector);
              return false;
            },
          },
        ].filter(Boolean),
      };
      return {
        title: i18n.navigation.title,
        sections: [navSection, optionSection],
      };
    }),
  );
};

const openAIConsent = (injector: Injector) => {
  const dialogRef = injector.get(MatDialog).open(GptOptInPrivacyComponent, {
    autoFocus: false,
    width: '80%',
    maxWidth: '600px',
  });
  dialogRef.afterClosed().subscribe((result) => {
    injector.get(AccountStateService).updateGPTConsentState(result);
  });
};

const openRateApp = (user: User, injector: Injector) => {
  injector
    .get(RatingService)
    .getByAccountId(user.id)
    .subscribe((r) => {
      const dialogRef = injector.get(MatDialog).open(AppRatingComponent);
      dialogRef.componentInstance.rating = r;
      dialogRef.componentInstance.onSuccess = () => {
        dialogRef.close();
      };
    });
};

const showImprint = (injector: Injector) => {
  injector.get(MatDialog).open(ImprintComponent, {
    width: '80%',
    maxWidth: '600px',
  });
};

const showGDPR = (injector: Injector) => {
  injector.get(MatDialog).open(DataProtectionComponent, {
    width: '80%',
    maxWidth: '600px',
  });
};

const showNews = (injector: Injector) => {
  injector.get(AppStateService).openMotdDialog();
};

const startTour = (injector: Injector) => {
  injector.get(OnboardingService).startDefaultTour(true);
};

const showDemo = (injector: Injector) => {
  injector.get(MatDialog).open(DemoVideoComponent, {
    width: '80%',
    maxWidth: '600px',
  });
};