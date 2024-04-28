import { Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataProtectionComponent } from 'app/components/home/_dialogs/data-protection/data-protection.component';
import { DemoVideoComponent } from 'app/components/home/_dialogs/demo-video/demo-video.component';
import { ImprintComponent } from 'app/components/home/_dialogs/imprint/imprint.component';
import { AccountStateService } from 'app/services/state/account-state.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { OnboardingService } from 'app/services/util/onboarding.service';
import { M3NavigationTemplate } from 'modules/navigation/m3-navigation.types';
import { Observable, map } from 'rxjs';

export const getDefaultTemplate = (
  injector: Injector,
): Observable<M3NavigationTemplate> => {
  const accountState = injector.get(AccountStateService);
  const router = injector.get(Router);
  return accountState.user$.pipe(
    map((user) => {
      const isHome = router.url.startsWith('/home');
      const isUser = router.url.startsWith('/user');
      const template: M3NavigationTemplate = {
        elevation: 0,
        header: {
          title: 'frag.jetzt',
          options: [
            {
              icon: 'help_outline',
              title: 'Help',
              onClick: () => console.log('Help clicked'),
            },
            user
              ? {
                  icon: 'account_circle',
                  title: 'Manage account',
                  items: [
                    {
                      icon: 'grade',
                      title: 'Meine Bonus-Sterne',
                      onClick: () => console.log(''),
                    },
                    {
                      icon: 'badge',
                      title: 'Q&A Pseudonym',
                      onClick: () => console.log('Pseudo clicked'),
                    },
                    {
                      icon: 'policy',
                      title: 'KI Datenschutz',
                      onClick: () => console.log('AI clicked'),
                    },
                    {
                      icon: 'smart_toy',
                      title: 'Meine KI-Prompts',
                      onClick: () => router.navigate(['/gpt-prompts']),
                    },
                    {
                      icon: 'manage_accounts',
                      title: 'Konto anpassen',
                      onClick: () => console.log('Manage clicked'),
                    },
                    {
                      icon: 'person_remove',
                      title: 'Konto löschen',
                      onClick: () => console.log('Delete clicked'),
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
              icon: 'light_mode',
              title: 'Heller Modus',
              onClick: () => console.log('Light clicked'),
            },
          ],
        },
        navigations: [],
        options: [],
        divideOptions: true,
      };
      if (user) {
        template.navigations.push({
          title: 'Meine Räume',
          icon: 'person',
          onClick: () => router.navigate(['/user']),
          activated: isUser,
        });
      }
      if (isHome || isUser) {
        template.navigations.unshift({
          title: 'Home',
          icon: 'home',
          onClick: () => router.navigate(['/home']),
          activated: isHome,
        });
      } else {
        template.navigations.push({
          title: 'Home',
          icon: 'home',
          onClick: () => router.navigate(['/home']),
          activated: isHome,
        });
      }
      template.options.push({
        title: 'Über frag.jetzt',
        options: [
          {
            icon: 'summarize',
            title: 'Intro',
            onClick: () => showDemo(injector),
          },
          {
            icon: 'flag',
            title: 'Tour',
            onClick: () => startTour(injector),
          },
          accountState.getCurrentUser() && {
            icon: 'campaign',
            title: 'News',
            onClick: () => showNews(injector),
          },
          {
            icon: 'rate_review',
            title: 'Feedback-Raum',
            onClick: () =>
              open('https://frag.jetzt/participant/room/Feedback', '_blank'),
          },
          {
            icon: 'grade',
            title: 'App bewerten',
            onClick: () => console.log('rate app'),
          },
          {
            icon: 'security',
            title: 'Datenschutz',
            onClick: () => showGDPR(injector),
          },
          {
            icon: 'privacy_tip',
            title: 'Impressum',
            onClick: () => showImprint(injector),
          },
        ].filter(Boolean),
      });
      return template;
    }),
  );
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
