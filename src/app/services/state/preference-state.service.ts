import { Injectable } from '@angular/core';
import {
  Observable,
  Subject,
  concat,
  distinctUntilChanged,
  map,
  shareReplay,
  take,
} from 'rxjs';
import { InitService } from '../util/init.service';
import { dataService } from 'app/base/db/data-service';

export interface CacheStrategyAlways {
  type: 'always';
}

export interface CacheStrategyNewest {
  type: 'newest';
  count: number;
}

export interface CacheStrategyLatest {
  type: 'latest';
}

export interface CacheStrategyMarked {
  type: 'marked';
  list: string[];
}

export interface CacheStrategyNone {
  type: 'none';
}

interface Mapper {
  always: CacheStrategyAlways;
  newest: CacheStrategyNewest;
  latest: CacheStrategyLatest;
  marked: CacheStrategyMarked;
  none: CacheStrategyNone;
}

const ALLOWED_TYPES = {
  // Platform
  motd: ['latest', 'always'],
  // Account,
  user: ['always'],
  // Room => room-access, moderators, comments
  room: ['always', 'newest', 'marked', 'none'],
} as const;

export type CacheTypeKey = keyof typeof ALLOWED_TYPES;
export type CacheStrategyObject = {
  [Key in CacheTypeKey]: Mapper[(typeof ALLOWED_TYPES)[Key][number]];
};

export const DEFAULT_CACHE_POLICY = {
  motd: {
    type: 'latest',
  },
  user: {
    type: 'always',
  },
  room: {
    type: 'always',
  },
} satisfies CacheStrategyObject;

@Injectable({
  providedIn: 'root',
})
export class PreferenceStateService {
  readonly preferences$: Observable<CacheStrategyObject>;
  private readonly updatePreference$ = new Subject<CacheStrategyObject>();

  constructor(private initService: InitService) {
    this.preferences$ = concat(
      dataService.config
        .get('cache-preferences')
        .pipe(map((v) => v?.value as CacheStrategyObject)),
      this.updatePreference$,
    ).pipe(distinctUntilChanged(), shareReplay(1));
    this.initService.init$.pipe(take(1)).subscribe(() => {
      // Side effects
      // Ensure valid
      this.preferences$.pipe(take(1)).subscribe((preferences) => {
        let changed = false;
        if (!preferences) {
          changed = true;
          preferences = {} as CacheStrategyObject;
        }
        const toDelete = new Set(Object.keys(preferences));
        for (const key of Object.keys(DEFAULT_CACHE_POLICY)) {
          if (
            toDelete.delete(key) &&
            ALLOWED_TYPES[key].includes(preferences[key].type)
          ) {
            continue;
          }
          preferences[key] = structuredClone(DEFAULT_CACHE_POLICY[key]);
          changed = true;
        }
        for (const key of toDelete) {
          changed = true;
          delete preferences[key];
        }
        if (changed) {
          this.updatePreferences(preferences);
        }
      });
    });
  }

  updatePreferences(preferences: CacheStrategyObject) {
    dataService.config
      .createOrUpdate({ key: 'cache-preferences', value: preferences })
      .subscribe(() => this.updatePreference$.next(preferences));
  }
}
