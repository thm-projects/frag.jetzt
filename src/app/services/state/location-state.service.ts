import { Injectable } from '@angular/core';
import { NavigationEnd, Router, RoutesRecognized } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

/*
  For Room regexes data match:
  data[1] => creator | room | participant
  data[2] => roomShortId
*/
export interface RouteData {
  regex: RegExp;
  isRoom?: true;
}

export interface RouteMapping {
  [key: string]: RouteData;
}

export const ROUTES = {
  room: {
    regex: /^\/(creator|moderator|participant)\/room\/([^/]*)\/?$/i,
    isRoom: true,
  },
  comments: {
    regex: /^\/(creator|moderator|participant)\/room\/([^/]*)\/comments\/?$/i,
    isRoom: true,
  },
  'comment-answer': {
    regex:
      /^\/(creator|moderator|participant)\/room\/([^/]*)\/comment\/([^/]+)\/?/i,
    isRoom: true,
  },
  'comment-conversation': {
    regex:
      /^\/(creator|moderator|participant)\/room\/([^/]*)\/comment\/([^/]+)\/conversation\/?/i,
    isRoom: true,
  },
  'gpt-chat-room': {
    regex:
      /^\/(creator|moderator|participant)\/room\/([^/]*)\/gpt-chat-room\/?$/i,
    isRoom: true,
  },
  moderation: {
    regex:
      /^\/(creator|moderator|participant)\/room\/([^/]*)\/moderator\/comments\/?$/i,
    isRoom: true,
  },
  focus: {
    regex:
      /^\/(creator|moderator|participant)\/room\/([^/]*)\/comments\/questionwall\/?$/i,
    isRoom: true,
  },
  radar: {
    regex:
      /^\/(creator|moderator|participant)\/room\/([^/]*)\/comments\/tagcloud\/?$/i,
    isRoom: true,
  },
  brainstorming: {
    regex:
      /^\/(creator|moderator|participant)\/room\/([^/]*)\/comments\/brainstorming\/?$/i,
    isRoom: true,
  },
  user: {
    regex: /^\/user\/?$/i,
  },
  'prompt-catalog': {
    regex: /^\/gpt-prompts\/?$/i,
  },
  'admin-dashboard': {
    regex: /^\/admin\/overview\/?$/i,
  },
  'admin-motd': {
    regex: /^\/admin\/create-motd\/?$/i,
  },
  'admin-gpt-config': {
    regex: /^\/admin\/gpt-config\/?$/i,
  },
  'admin-chat': {
    regex: /^\/admin\/gpt-chat\/?$/i,
  },
  'admin-global-prompt-catalog': {
    regex: /^\/admin\/gpt-prompts\/?$/i,
  },
  'admin-mailing': {
    regex: /^\/admin\/mailing\/?$/i,
  },
  'admin-keycloak-provider': {
    regex: /^\/admin\/keycloak-provider\/?$/i,
  },
  home: {
    regex: /^(\/|(\/home\/?))$/i,
  },
} as const satisfies RouteMapping;

export type URLShortNames = keyof typeof ROUTES | 'unknown';

export interface RouteLocation {
  url: string;
  shortName: URLShortNames;
  data?: RegExpMatchArray;
  metadata?: RouteData;
}

@Injectable({
  providedIn: 'root',
})
export class LocationStateService {
  readonly currentRecognized$ = new BehaviorSubject<RouteLocation>(null);
  readonly currentRoute$ = new BehaviorSubject<RouteLocation>(null);

  constructor(router: Router) {
    router.events.subscribe((e) => {
      if (e instanceof RoutesRecognized) {
        this.currentRecognized$.next(this.toLocation(e));
      }
      if (e instanceof NavigationEnd) {
        this.currentRoute$.next(this.toLocation(e));
      }
    });
  }

  static getCurrentLocation(encodedUrl: string) {
    const size = encodedUrl.length + 1;
    const index = (encodedUrl.indexOf('#') + size) % size;
    const index2 = (encodedUrl.indexOf('?') + size) % size;
    encodedUrl = encodedUrl.substring(0, Math.min(index, index2));
    return decodeURI(encodedUrl);
  }

  getCurrentRecognized(): RouteLocation {
    return this.currentRecognized$.value;
  }

  private toLocation(event: RoutesRecognized | NavigationEnd): RouteLocation {
    const url = LocationStateService.getCurrentLocation(event.url);
    let location: RouteLocation = null;
    for (const key of Object.keys(ROUTES)) {
      const metadata = ROUTES[key as keyof typeof ROUTES];
      const regex = metadata.regex;
      const data = url.match(regex);
      if (!data) {
        continue;
      }
      if (location) {
        console.warn(
          'Found multiple locations for this route: ' +
            location.shortName +
            ' & ' +
            key,
        );
      }
      location = {
        shortName: key as URLShortNames,
        url,
        data,
        metadata,
      };
    }
    if (!location) {
      console.warn('Unknown location: ' + url);
      return {
        shortName: 'unknown',
        url,
      };
    }
    return location;
  }
}
