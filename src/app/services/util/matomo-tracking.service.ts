/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { RoomStateService } from '../state/room-state.service';
import { user$ } from 'app/user/state/user';

@Injectable({
  providedIn: 'root',
})
export class MatomoTrackingService {
  private lastUrl = '/';
  private readonly CONFIG = [
    [
      /^\/quiz$/,
      () => {
        this.setDocumentTitle('Quizzing');
      },
    ],
    [
      /^\/(creator|moderator)\/room\/([^/]+)\/moderator\/comments$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Moderation page');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^/]+)$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Room page');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^/]+)\/comments$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Q&A');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^/]+)\/comments\/tagcloud$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Keyword word cloud');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^/]+)\/comments\/brainstorming$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Brainstorming');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
    [
      /^\/(creator|moderator|participant)\/room\/([^/]+)\/comments\/questionwall$/,
      (exp: RegExpMatchArray) => {
        this.setDocumentTitle('Question focus');
        this.setCustomVariable(1, 'VisitorRole', exp[1], 'page');
        this.setCustomVariable(2, 'UserRole', this.getUserRoleString(), 'page');
        this.setCustomVariable(3, 'RoomShortId', exp[2], 'page');
      },
    ],
  ] as const;

  constructor(
    private router: Router,
    private roomState: RoomStateService,
  ) {
    if (!environment.production) {
      return;
    }
    //TODO: INIT
    user$.subscribe((user) => {
      if (user?.id) {
        this.setUserId(user.id);
      } else {
        this.resetUserId();
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
        this.setReferrerUrl(this.lastUrl);
        this.lastUrl = url;
        this.setCustomUrl(url);
        this.deleteCustomVariables('page');
        operation(match);
        this.trackPageView();
        return;
      }
    }
    this.lastUrl = url;
  }

  private setDocumentTitle(title: string) {
    //TODO
  }

  private setCustomVariable(
    slot: number,
    name: string,
    value: string,
    scope: 'page' | 'visit' | 'event' | 'action',
  ) {
    //TODO
  }

  private setReferrerUrl(url: string) {
    //TODO
  }

  private setCustomUrl(url: string) {
    //TODO
  }

  private deleteCustomVariables(scope: 'page' | 'visit' | 'event' | 'action') {
    //TODO
  }

  private trackPageView() {
    //TODO
  }

  private setUserId(userId: string) {
    //TODO
  }

  private resetUserId() {
    //TODO
  }
}
