import { Injector } from '@angular/core';
import { OnlineStateService } from 'app/services/state/online-state.service';
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
import {
  combineLatest,
  first,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
} from 'rxjs';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AVAILABLE_LANGUAGES,
  language,
  setLanguage,
} from 'app/base/language/language';

import i18nRaw from './default-navigation.i18n.json';
import { FeatureGridDialogComponent } from '../components/home/home-page/feature-grid/feature-grid-dialog/feature-grid-dialog.component';
import { logout, openLogin, user$ } from 'app/user/state/user';
import { ThemeColorComponent } from './dialogs/theme-color/theme-color.component';
import { DonationRouteComponent } from 'app/paypal/donation-route/donation-route.component';
import { RoomService } from '../services/http/room.service';
import { BonusTokenService } from '../services/http/bonus-token.service';
import { switchMap } from 'rxjs/operators';
import { DeleteAccountDialogComponent } from './dialogs/delete-account/delete-account-dialog.component';
import { AuthenticationService } from '../services/http/authentication.service';

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
  const router = injector.get(Router);
  const dialog = injector.get(MatDialog);
  const keycloak = injector.get(KeycloakService);
  const authService = injector.get(AuthenticationService);
  const roomService = injector.get(RoomService);
  const bonusTokenService = injector.get(BonusTokenService);
  const onlineStateService = injector.get(OnlineStateService);
  return combineLatest([
    user$,
    toObservable(i18n, { injector }),
    onlineStateService.online$,
    hasRoomsOrTokens(user$, injector),
  ]).pipe(
    map(([user, i18n, isOnline, hasData]): M3HeaderTemplate => {
      const isHome = router.url.startsWith('/home');
      const isAdmin = user?.hasRole(KeycloakRoles.AdminDashboard);
      const isGuestUser = user?.isGuest;

      const account_icon = isAdmin
        ? 'admin_panel_settings'
        : isGuestUser
          ? 'domino_mask'
          : 'account_circle';

      return {
        slogan: isHome ? i18n.header.slogan : '',
        offline: i18n.header.offline,
        options: [
          user
            ? {
                id: 'account',
                icon: isOnline
                  ? account_icon
                  : 'signal_cellular_connected_no_internet_0_bar',
                title: i18n.header.myAccount,
                className: isOnline ? '' : 'error-text',
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
                  isAdmin && {
                    icon: 'manage_accounts',
                    title: i18n.header.manageAccount,
                    onClick: () => {
                      keycloak.redirectAccountManagement();
                    },
                  },
                  ((isGuestUser && hasData) || !isGuestUser) && {
                    icon: 'person_remove',
                    title: i18n.header.deleteAccount,
                    onClick: () => {
                      DeleteAccountDialogComponent.openDialog(
                        dialog,
                        keycloak,
                        roomService,
                        bonusTokenService,
                        authService,
                      );
                    },
                  },
                  {
                    icon: 'logout',
                    title: i18n.header.logout,
                    onClick: () => logout().subscribe(),
                  },
                ].filter(Boolean),
              }
            : {
                id: 'login',
                icon: isOnline
                  ? 'login'
                  : 'signal_cellular_connected_no_internet_0_bar',
                title: i18n.header.login,
                className: isOnline ? '' : 'error-text',
                onClick: () => openLogin().subscribe(),
              },
          {
            id: 'language',
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
            icon: 'colors',
            title: i18n.header.theme,
            onClick: () => openThemeColor(injector),
          },
        ],
      } as M3HeaderTemplate;
    }),
  );
};

export const isStandalone = (): boolean => {
  return (
    navigator['standalone'] ||
    window.matchMedia('(display-mode: standalone)').matches
  );
};

export const getDefaultNavigation = (
  injector: Injector,
): Observable<M3NavigationTemplate> => {
  const router = injector.get(Router);
  return combineLatest([
    user$,
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
      const isGuestUser = user?.isGuest;
      // app navigation
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
          icon: 'meeting_room',
          onClick: () => {
            router.navigate(['/user']);
            return true;
          },
          activated: isUser,
        });
      }
      if (user && isUser && !isGuestUser) {
        navSection.entries.push({
          id: 'chat-with-ai',
          title: i18n.navigation.chat,
          svgIcon: 'fj_robot',
          onClick: () => {
            router.navigate(['/creator/room/Feedback/gpt-chat-room']);
            return true;
          },
        });
      }
      if (isHome || isUser) {
        navSection.entries.unshift({
          id: 'home',
          title: i18n.navigation.home,
          icon: 'home_pin',
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
          icon: 'home_pin',
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
      if (user?.hasRole(KeycloakRoles.AdminDashboard)) {
        navSection.entries.push({
          id: 'overview',
          title: i18n.navigation.user,
          icon: 'admin_panel_settings',
          onClick: () => {
            router.navigate(['/user/overview']);
            return true;
          },
        });
      }
      // app navigation
      const isPurchase = router.url.startsWith('/purchase');
      const isTransaction = router.url.startsWith('/transactions');
      const transactionsDisabled = true;
      const pricingSection: M3NavigationSection = {
        id: 'pricing',
        kind: 'navigation',
        title: i18n.navigation.pricing,
        entries: [
          !transactionsDisabled &&
            user && {
              id: 'purchase',
              title: i18n.navigation.purchase,
              svgIcon: 'fj_robot',
              onClick: () => {
                router.navigate(['/purchase']);
                return true;
              },
              activated: isPurchase,
            },
          user && {
            id: 'donation',
            title: i18n.navigation.donation,
            icon: 'volunteer_activism',
            onClick: () => {
              showDonation(injector);
              return false;
            },
          },
          !transactionsDisabled &&
            user &&
            !user.isGuest && {
              id: 'transaction',
              title: i18n.navigation.transaction,
              svgIcon: 'fj_robot',
              onClick: () => {
                router.navigate(['/transaction']);
                return true;
              },
              activated: isTransaction,
            },
        ].filter(Boolean),
      };
      // OPTIONS
      const optionSection: M3NavigationOptionSection = {
        id: 'about',
        kind: 'options',
        title: i18n.options.about,
        options: [
          {
            id: 'intro',
            title: i18n.options.introTitle,
            icon: 'info',
            options: [
              {
                id: 'features',
                icon: 'apps',
                title: i18n.options.features,
                onClick: () => {
                  injector
                    .get(MatDialog)
                    .open(FeatureGridDialogComponent, { width: '800px' });
                  return false;
                },
              },
              {
                id: 'demo',
                title: i18n.options.intro,
                icon: 'description',
                onClick: () => {
                  showDemo(injector);
                  return false;
                },
              },
              ...(router.url === '/home'
                ? [
                    {
                      id: 'tour',
                      icon: 'tour',
                      title: i18n.options.tour,
                      onClick: () => {
                        startTour(injector);
                        return true;
                      },
                    },
                  ]
                : []),
            ],
          },
          {
            id: 'feedback',
            title: i18n.options.feedbackTitle,
            icon: 'reviews',
            options: [
              {
                id: 'feedback-room',
                icon: 'door_front',
                title: i18n.options.feedbackRoom,
                onClick: () => {
                  open(
                    'https://frag.jetzt/participant/room/Feedback',
                    '_blank',
                  );
                  return true;
                },
              },
              user && {
                id: 'rate-app',
                icon: 'grade',
                title: i18n.options.rateApp,
                onClick: () => {
                  openRateApp(user, injector);
                  return false;
                },
              },
            ].filter(Boolean),
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
          user && {
            id: 'logout',
            icon: 'logout',
            title: i18n.header.logout,
            onClick: () => {
              logout().subscribe();
              return false;
            },
          },
        ].filter(Boolean),
      };
      const sections = [navSection] as (
        | M3NavigationSection
        | M3NavigationOptionSection
      )[];
      if (pricingSection.entries.length > 0) {
        sections.push(pricingSection);
      }
      sections.push(optionSection);
      return { title: i18n.navigation.title, sections: sections };
    }),
  );
};

const openAIConsent = (injector: Injector) => {
  const dialogRef = injector
    .get(MatDialog)
    .open(GptOptInPrivacyComponent, { autoFocus: false });
  dialogRef.afterClosed().subscribe((result) => {
    injector.get(AccountStateService).updateGPTConsentState(result);
  });
};

const openRateApp = (user: User, injector: Injector) => {
  const service = injector.get(RatingService);
  forkJoin([service.getRatings(), service.getByAccountId(user.id)]).subscribe(
    ([ratings, r]) => {
      const dialogRef = injector.get(MatDialog).open(AppRatingComponent);
      dialogRef.componentInstance.mode.set('dialog');
      dialogRef.componentInstance.rating = r;
      dialogRef.componentRef.setInput('ratingResults', ratings);
      dialogRef.componentInstance.onSuccess = () => {
        dialogRef.close();
      };
    },
  );
};

const showImprint = (injector: Injector) => {
  injector
    .get(MatDialog)
    .open(ImprintComponent, { width: '80%', maxWidth: '600px' });
};

const showDonation = (injector: Injector) => {
  injector.get(MatDialog).open(DonationRouteComponent);
};

const showGDPR = (injector: Injector) => {
  injector
    .get(MatDialog)
    .open(DataProtectionComponent, { width: '80%', maxWidth: '600px' });
};

const showNews = (injector: Injector) => {
  injector.get(AppStateService).openMotdDialog();
};

const startTour = (injector: Injector) => {
  injector.get(OnboardingService).startDefaultTour(true);
};

const showDemo = (injector: Injector) => {
  injector
    .get(MatDialog)
    .open(DemoVideoComponent, { width: '80%', maxWidth: '600px' });
};

const openThemeColor = (injector: Injector) => {
  injector.get(MatDialog).open(ThemeColorComponent);
};

const hasRoomsOrTokens = (
  user: Observable<User>,
  injector: Injector,
): Observable<boolean> => {
  return combineLatest([user]).pipe(
    switchMap(([u]) => {
      if (!u) {
        return of(false);
      }
      const roomService = injector.get(RoomService).getCreatorRooms(u.id);
      const tokenService = injector
        .get(BonusTokenService)
        .getTokensByUserId(u.id);
      return forkJoin([roomService, tokenService]).pipe(
        map(([rooms, tokens]) => {
          const hasRooms = rooms.length !== 0;
          const hasTokens = tokens.length !== 0;
          return hasRooms || hasTokens;
        }),
      );
    }),
  );
};
