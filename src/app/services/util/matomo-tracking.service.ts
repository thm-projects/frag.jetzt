import { Injectable } from '@angular/core';
import { MatomoInjector, MatomoTracker } from 'ngx-matomo-v9';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MatomoTrackingService {

  private lastUrl = '/';
  private readonly CONFIG = [
    [/^\/quiz$/, () => {
      this.matomoTracker.setDocumentTitle('Quizzing');
    }],
    [/^\/(creator|moderator)\/room\/([^\/]+)\/moderator\/comments$/, () => {
      this.matomoTracker.setDocumentTitle('Moderation page');
    }],
    [/^\/(creator|moderator|participant)\/room\/([^\/]+)\/comments\/tagcloud$/, () => {
      this.matomoTracker.setDocumentTitle('Keyword word cloud');
    }],
    [/^\/(creator|moderator|participant)\/room\/([^\/]+)\/comments\/brainstorming$/, () => {
      this.matomoTracker.setDocumentTitle('Brainstorming');
    }],
    [/^\/(creator|moderator|participant)\/room\/([^\/]+)\/comments\/questionwall$/, () => {
      this.matomoTracker.setDocumentTitle('Question focus');
    }],
  ] as const;

  constructor(
    private matomoInjector: MatomoInjector,
    private matomoTracker: MatomoTracker,
    private router: Router,
  ) {
    if (environment.name !== 'prod') {
      return;
    }
    this.matomoInjector.init('/matomo/', 6);
    this.router.events.subscribe(e => {
      if (!(e instanceof NavigationEnd)) {
        return;
      }
      this.onNavigate();
    });
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
        operation();
        this.matomoTracker.trackPageView();
        return;
      }
    }
    this.lastUrl = url;
  }
}
