import { Injectable } from '@angular/core';
import { MatomoInjector, MatomoTracker } from 'ngx-matomo-v9';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AccountStateService } from '../state/account-state.service';
import { RoomStateService } from '../state/room-state.service';

@Injectable({
  providedIn: 'root',
})
export class MatomoTrackingService {
  private lastUrl = '/';
  private readonly CONFIG = [
    [
      /^\/quiz$/,
      () => {
        this.matomoTracker.setDocumentTitle('Quizzing');
      },
    ],
    [
      /^\/(creator|moderator)\/room\/([^\/]+)\/moderator\/comments$/,
      (exp: RegExpMatchArray) => {
        this.matomoTracker.setDocumentTitle('Moderation page');
        this.matomoTracker.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.matomoTracker.setCustomVariable(
          2,
          'UserRole',
          this.getUserRoleString(),
          'page',
        );
        this.matomoTracker.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^\/]+)$/,
      (exp: RegExpMatchArray) => {
        this.matomoTracker.setDocumentTitle('Room page');
        this.matomoTracker.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.matomoTracker.setCustomVariable(
          2,
          'UserRole',
          this.getUserRoleString(),
          'page',
        );
        this.matomoTracker.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^\/]+)\/comments$/,
      (exp: RegExpMatchArray) => {
        this.matomoTracker.setDocumentTitle('Q&A');
        this.matomoTracker.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.matomoTracker.setCustomVariable(
          2,
          'UserRole',
          this.getUserRoleString(),
          'page',
        );
        this.matomoTracker.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^\/]+)\/comments\/tagcloud$/,
      (exp: RegExpMatchArray) => {
        this.matomoTracker.setDocumentTitle('Keyword word cloud');
        this.matomoTracker.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.matomoTracker.setCustomVariable(
          2,
          'UserRole',
          this.getUserRoleString(),
          'page',
        );
        this.matomoTracker.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^\/]+)\/comments\/brainstorming$/,
      (exp: RegExpMatchArray) => {
        this.matomoTracker.setDocumentTitle('Brainstorming');
        this.matomoTracker.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.matomoTracker.setCustomVariable(
          2,
          'UserRole',
          this.getUserRoleString(),
          'page',
        );
        this.matomoTracker.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^\/]+)\/comments\/questionwall$/,
      (exp: RegExpMatchArray) => {
        this.matomoTracker.setDocumentTitle('Question focus');
        this.matomoTracker.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.matomoTracker.setCustomVariable(
          2,
          'UserRole',
          this.getUserRoleString(),
          'page',
        );
        this.matomoTracker.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
  ] as const;

  constructor(
    private matomoInjector: MatomoInjector,
    private matomoTracker: MatomoTracker,
    private router: Router,
    private accountState: AccountStateService,
    private roomState: RoomStateService,
  ) {
    if (environment.name !== 'prod') {
      return;
    }
    this.matomoInjector.init('/matomo/', 6);
    this.accountState.user$.subscribe((user) => {
      if (user?.id) {
        this.matomoTracker.setUserId(user.id);
      } else {
        this.matomoTracker.resetUserId();
      }
    });
    this.router.events.subscribe((e) => {
      if (!(e instanceof NavigationEnd)) {
        return;
      }
      this.onNavigate();
    });
  }

  private getUserRoleString(): string {
    return this.roomState.getCurrentRole() ?? 'N/A';
  }

  private onNavigate() {
    const url = decodeURI(this.router.url);
    for (const [key, operation] of this.CONFIG) {
      const match = url.match(key);
      if (match) {
        this.matomoTracker.setReferrerUrl(this.lastUrl);
        this.lastUrl = url;
        this.matomoTracker.setCustomUrl(url);
        this.matomoTracker.deleteCustomVariables('page');
        operation(match);
        this.matomoTracker.trackPageView();
        return;
      }
    }
    this.lastUrl = url;
  }
}
