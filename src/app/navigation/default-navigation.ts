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
  M3HeaderTemplate,
  M3NavigationOptionSection,
  M3NavigationSection,
  M3NavigationTemplate,
} from 'modules/navigation/m3-navigation.types';
import { Observable, combineLatest, first, map, startWith } from 'rxjs';

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
  return accountState.user$.pipe(
    map((user) => {
      return {
        slogan: 'Du fragst. ChatGPT antwortet.',
        options: [
          user
            ? {
                icon: 'account_circle',
                title: 'Manage account',
                items: [
                  {
                    icon: 'grade',
                    title: 'Meine Bonus-Sterne',
                    onClick: () => {
                      UserBonusTokenComponent.openDialog(dialog, user.id);
                    },
                  },
                  {
                    icon: 'policy',
                    title: 'KI Datenschutz',
                    onClick: () => {
                      openAIConsent(injector);
                    },
                  },
                  {
                    icon: 'smart_toy',
                    title: 'Meine KI-Prompts',
                    onClick: () => {
                      router.navigate(['/gpt-prompts']);
                    },
                  },
                  {
                    icon: 'manage_accounts',
                    title: 'Konto anpassen',
                    onClick: () => {
                      keycloak.redirectAccountManagement();
                    },
                  },
                  {
                    icon: 'person_remove',
                    title: 'Konto löschen',
                    onClick: () => {
                      keycloak.deleteAccount();
                    },
                  },
                  {
                    icon: 'logout',
                    title: 'Abmelden',
                    onClick: () => accountState.logout().subscribe(),
                  },
                ],
              }
            : {
                icon: 'login',
                title: 'Login',
                onClick: () => accountState.openLogin().subscribe(),
              },
          {
            icon: 'language',
            title: 'Sprache',
            items: [
              {
                icon: 'flag',
                title: 'Deutsch',
                onClick: () => console.log('German clicked'),
              },
              {
                icon: 'flag',
                title: 'English',
                onClick: () => console.log('English clicked'),
              },
              {
                icon: 'flag',
                title: 'Français',
                onClick: () => console.log('French clicked'),
              },
            ],
          },
          {
            icon: 'settings_brightness',
            title: 'Design',
            items: [
              {
                icon: 'light_mode',
                title: 'Hell',
                onClick: () => console.log('Light clicked'),
              },
              {
                icon: 'dark_mode',
                title: 'Dunkel',
                onClick: () => console.log('Dark clicked'),
              },
              {
                icon: 'nights_stay',
                title: 'System',
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
  ]).pipe(
    map((user) => {
      const isHome = router.url.startsWith('/home');
      const isUser = router.url.startsWith('/user');
      const navSection: M3NavigationSection = {
        title: 'App',
        entries: [],
      };
      if (user) {
        navSection.entries.push({
          title: 'Meine Räume',
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
          title: 'Home',
          icon: 'home',
          onClick: () => {
            router.navigate(['/home']);
            return true;
          },
          activated: isHome,
        });
      } else {
        navSection.entries.push({
          title: 'Home',
          icon: 'home',
          onClick: () => {
            router.navigate(['/home']);
            return true;
          },
          activated: isHome,
        });
      }
      return {
        title: 'frag.jetzt',
        sections: [navSection],
      };
    }),
  );
};

export const getDefaultOptions = (
  injector: Injector,
): Observable<M3NavigationOptionSection[]> => {
  const accountState = injector.get(AccountStateService);
  return accountState.user$.pipe(
    map((user) => {
      return [
        {
          title: 'Über frag.jetzt',
          options: [
            {
              title: 'Einführung',
              icon: 'summarize',
              options: [
                {
                  icon: 'summarize',
                  title: 'Intro',
                  onClick: () => {
                    showDemo(injector);
                    return false;
                  },
                },
                {
                  icon: 'flag',
                  title: 'Tour',
                  onClick: () => {
                    startTour(injector);
                    return false;
                  },
                },
              ],
            },
            {
              title: 'Feedback',
              icon: 'rate_review',
              options: [
                {
                  icon: 'rate_review',
                  title: 'Feedback-Raum',
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
                  title: 'App bewerten',
                  onClick: () => {
                    openRateApp(user, injector);
                    return false;
                  },
                },
              ],
            },
            accountState.getCurrentUser() && {
              icon: 'campaign',
              title: 'News',
              onClick: () => {
                showNews(injector);
                return false;
              },
            },
            {
              icon: 'security',
              title: 'Datenschutz',
              onClick: () => {
                showGDPR(injector);
                return false;
              },
            },
            {
              icon: 'privacy_tip',
              title: 'Impressum',
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
