import { Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { DataProtectionComponent } from 'app/components/home/_dialogs/data-protection/data-protection.component';
import { DemoVideoComponent } from 'app/components/home/_dialogs/demo-video/demo-video.component';
import { ImprintComponent } from 'app/components/home/_dialogs/imprint/imprint.component';
import { UserBonusTokenComponent } from 'app/components/participant/_dialogs/user-bonus-token/user-bonus-token.component';
import { GptOptInPrivacyComponent } from 'app/components/shared/_dialogs/gpt-optin-privacy/gpt-optin-privacy.component';
import { AppRatingComponent } from 'app/components/shared/app-rating/app-rating.component';
import { User } from 'app/models/user';
import { RatingService } from 'app/services/http/rating.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { KeycloakService } from 'app/services/util/keycloak.service';
import { OnboardingService } from 'app/services/util/onboarding.service';
import {
  HEADER,
  NAVIGATION,
  OPTIONS,
} from 'modules/navigation/m3-navigation-emitter';
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

import i18n from './default-navigation.i18n.json';
import {
  AVAILABLE_LANGUAGES,
  language,
  setLanguage,
} from 'app/base/language/language';
const l10n = I18nLoader.loadModule(i18n);

export const applyDefaultNavigation = (
  injector: Injector,
): Observable<void> => {
  return combineLatest([
    getDefaultHeader(injector),
    getDefaultNavigation(injector),
    getDefaultOptions(injector),
  ]).pipe(
    map(([header, navigation, options]) => {
      HEADER.set(header);
      NAVIGATION.set(navigation);
      OPTIONS.set(options);
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
  return combineLatest([accountState.user$, toObservable(l10n)]).pipe(
    map(([user, l10n]) => {
      return {
        slogan: 'Du fragst. ChatGPT antwortet.',
        options: [
          user
            ? {
                icon: 'account_circle',
                title: l10n.header.myAccount,
                items: [
                  {
                    icon: 'grade',
                    title: l10n.header.myStars,
                    onClick: () => {
                      UserBonusTokenComponent.openDialog(dialog, user.id);
                    },
                  },
                  {
                    icon: 'policy',
                    title: l10n.header.aiConsent,
                    onClick: () => {
                      openAIConsent(injector);
                    },
                  },
                  {
                    svgIcon: 'fj_robot',
                    title: l10n.header.myAiPrompts,
                    onClick: () => {
                      router.navigate(['/gpt-prompts']);
                    },
                  },
                  {
                    icon: 'manage_accounts',
                    title: l10n.header.manageAccount,
                    onClick: () => {
                      keycloak.redirectAccountManagement();
                    },
                  },
                  {
                    icon: 'person_remove',
                    title: l10n.header.deleteAccount,
                    onClick: () => {
                      keycloak.deleteAccount();
                    },
                  },
                  {
                    icon: 'logout',
                    title: l10n.header.logout,
                    onClick: () => accountState.logout().subscribe(),
                  },
                ],
              }
            : {
                icon: 'login',
                title: l10n.header.login,
                onClick: () => accountState.openLogin().subscribe(),
              },
          {
            icon: 'language',
            title: l10n.header.language,
            items: AVAILABLE_LANGUAGES.map(
              (lang) =>
                ({
                  icon: language() === lang ? 'check' : 'flag',
                  title: l10n.header.languages[lang],
                  disabled: language() === lang,
                  onClick: () => setLanguage(lang),
                }) as M3HeaderOption,
            ),
          },
          {
            icon: 'settings_brightness',
            title: l10n.header.theme,
            items: [
              {
                icon: 'light_mode',
                title: l10n.header.light,
                onClick: () => console.log('Light clicked'),
              },
              {
                icon: 'dark_mode',
                title: l10n.header.dark,
                onClick: () => console.log('Dark clicked'),
              },
              {
                icon: 'nights_stay',
                title: l10n.header.system,
                onClick: () => console.log('System clicked'),
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
    toObservable(l10n),
  ]).pipe(
    map(([user, , l10n]) => {
      const isHome = router.url.startsWith('/home');
      const isUser = router.url.startsWith('/user');
      const navSection: M3NavigationSection = {
        title: l10n.navigation.app,
        entries: [],
      };
      if (user) {
        navSection.entries.push({
          title: l10n.navigation.myRooms,
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
          title: l10n.navigation.home,
          icon: 'home',
          onClick: () => {
            router.navigate(['/home']);
            return true;
          },
          activated: isHome,
        });
      } else {
        navSection.entries.push({
          title: l10n.navigation.home,
          icon: 'home',
          onClick: () => {
            router.navigate(['/home']);
            return true;
          },
          activated: isHome,
        });
      }
      return {
        title: l10n.navigation.title,
        sections: [navSection],
      };
    }),
  );
};

export const getDefaultOptions = (
  injector: Injector,
): Observable<M3NavigationOptionSection[]> => {
  const accountState = injector.get(AccountStateService);
  return combineLatest([accountState.user$, toObservable(l10n)]).pipe(
    map(([user, l10n]) => {
      return [
        {
          title: l10n.options.about,
          options: [
            {
              title: l10n.options.introTitle,
              icon: 'summarize',
              options: [
                {
                  title: l10n.options.intro,
                  icon: 'summarize',
                  onClick: () => {
                    showDemo(injector);
                    return false;
                  },
                },
                {
                  icon: 'flag',
                  title: l10n.options.tour,
                  onClick: () => {
                    startTour(injector);
                    return false;
                  },
                },
              ],
            },
            {
              title: l10n.options.feedbackTitle,
              icon: 'rate_review',
              options: [
                {
                  icon: 'rate_review',
                  title: l10n.options.feedbackRoom,
                  onClick: () => {
                    open(
                      'https://frag.jetzt/participant/room/Feedback',
                      '_blank',
                    );
                    return true;
                  },
                },
                {
                  icon: 'grade',
                  title: l10n.options.rateApp,
                  onClick: () => {
                    openRateApp(user, injector);
                    return false;
                  },
                },
              ],
            },
            user && {
              icon: 'campaign',
              title: l10n.options.news,
              onClick: () => {
                showNews(injector);
                return false;
              },
            },
            {
              icon: 'security',
              title: l10n.options.dataProtection,
              onClick: () => {
                showGDPR(injector);
                return false;
              },
            },
            {
              icon: 'privacy_tip',
              title: l10n.options.imprint,
              onClick: () => {
                showImprint(injector);
                return false;
              },
            },
          ].filter(Boolean),
        },
      ];
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
