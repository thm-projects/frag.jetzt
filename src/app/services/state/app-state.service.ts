import { Injectable, inject } from '@angular/core';
import {
  Observable,
  Subject,
  concat,
  distinctUntilChanged,
  filter,
  map,
  merge,
  of,
  repeat,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { OnlineStateService } from './online-state.service';
import { PreferenceStateService } from './preference-state.service';
import { MotdService } from '../http/motd.service';
import {
  CookieDialogRequest,
  MotdDialogRequest,
  OnboardingRequest,
  SafariUnsupportedRequest,
  callServiceEvent,
} from 'app/utils/service-component-events';
import { themes, themes_meta } from '../../../theme/arsnova-theme.const';
import { DeviceStateService } from './device-state.service';
import { EventService } from '../util/event.service';
import { InitService } from '../util/init.service';
import { Language, language } from 'app/base/language/language';
import { toObservable } from '@angular/core/rxjs-interop';
import { dataService } from 'app/base/db/data-service';
import { Motd } from 'app/base/db/models/db-motd';
import { Router } from '@angular/router';

export type ThemeKey = keyof typeof themes;

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  readonly language$ = toObservable(language);
  readonly appliedTheme$: Observable<ThemeKey>;
  readonly theme$: Observable<ThemeKey>;
  readonly motd$: Observable<Motd[]>;
  readonly cookiesAccepted$: Observable<boolean>;
  private readonly updateTheme$ = new Subject<ThemeKey>();
  private readonly updateCookieAccepted$ = new Subject<boolean>();
  private router = inject(Router);

  constructor(
    private onlineState: OnlineStateService,
    private preferences: PreferenceStateService,
    private motd: MotdService,
    private deviceState: DeviceStateService,
    private eventService: EventService,
    private initService: InitService,
  ) {
    this.motd$ = this.onlineState
      .refreshWhenReachable(dataService.motd.getAll(), this.fetchMotds())
      .pipe(shareReplay(1));
    this.cookiesAccepted$ = concat(
      dataService.config
        .get('cookieAccepted')
        .pipe(map((v) => (v?.value ?? false) as boolean)),
      this.updateCookieAccepted$,
    ).pipe(distinctUntilChanged(), shareReplay(1));
    this.theme$ = concat(
      dataService.config.get('theme').pipe(
        map((v) => {
          const key = (v?.value as string) || 'systemDefault';
          return Object.keys(themes).includes(key)
            ? (key as ThemeKey)
            : 'systemDefault';
        }),
      ),
      this.updateTheme$,
    ).pipe(distinctUntilChanged(), shareReplay(1));
    this.appliedTheme$ = merge(this.theme$, this.deviceState.dark$)
      .pipe(
        switchMap(() => this.theme$.pipe(take(1))),
        map((theme) => {
          if (theme !== 'systemDefault') {
            return theme;
          }
          const dark = this.deviceState.isDark();
          return themes_meta['systemDefault'].config[
            dark ? 'dark' : 'light'
          ] as ThemeKey;
        }),
      )
      .pipe(distinctUntilChanged(), shareReplay(1));

    this.initService.init$.pipe(take(1)).subscribe(() => {
      // side effects
      this.cookiesAccepted$
        .pipe(
          filter((v) => !v),
          switchMap(() =>
            callServiceEvent(this.eventService, new CookieDialogRequest()),
          ),
          switchMap((v) =>
            dataService.config
              .createOrUpdate({ key: 'cookieAccepted', value: v.accepted })
              .pipe(
                switchMap(() => {
                  if (v.accepted) {
                    this.updateCookieAccepted$.next(true);
                    return of();
                  }
                  return this.leaveApp();
                }),
              ),
          ),
        )
        .subscribe();
      // Onboarding
      this.startOnboarding().subscribe();
    });
  }

  getCurrentLanguage() {
    let lang: Language = null;
    this.language$.subscribe((l) => (lang = l)).unsubscribe();
    return lang;
  }

  getCurrentMotds() {
    let motds: Motd[] = null;
    this.motd$.subscribe((m) => (motds = m)).unsubscribe();
    return motds;
  }

  changeTheme(theme: ThemeKey) {
    dataService.config
      .createOrUpdate({ key: 'theme', value: theme })
      .subscribe(() => this.updateTheme$.next(theme));
  }

  getCurrentTheme() {
    let theme: ThemeKey = null;
    this.theme$.subscribe((t) => (theme = t)).unsubscribe();
    return theme;
  }

  getCurrentAppliedTheme() {
    let theme: ThemeKey = null;
    this.appliedTheme$.subscribe((t) => (theme = t)).unsubscribe();
    return theme;
  }

  openMotdDialog() {
    this.motd$.subscribe((data) => {
      callServiceEvent(
        this.eventService,
        new MotdDialogRequest(data),
      ).subscribe();
    });
  }

  private fetchMotds(): Observable<Motd[]> {
    const tenMinutes = 10 * 60 * 1000;
    return this.motd.getAll().pipe(
      map((values) => values.map((v) => new Motd(v))),
      tap((motds) => this.saveMotds(motds)),
      repeat({ delay: tenMinutes }),
    );
  }

  private saveMotds(motds: Motd[]) {
    this.preferences.preferences$
      .pipe(
        take(1),
        switchMap((pref) => {
          const needsDelete = pref?.motd?.type !== 'always';
          const first = needsDelete ? dataService.motd.clear() : of(undefined);
          return first;
        }),
        switchMap(() => {
          return dataService.motd.createOrUpdateMany(
            motds.map((value) => ({ value })),
          );
        }),
      )
      .subscribe();
  }

  private leaveApp(): Observable<unknown> {
    close();
    this.iterateOut(location.origin);
    return of();
  }

  private iterateOut(origin: string) {
    if (location.origin !== origin) {
      return;
    }
    if (history.length < 1) {
      location.replace('about:blank');
      return;
    }
    history.go(-1);
    setImmediate(() => this.iterateOut(origin));
  }

  private startOnboarding(): Observable<unknown> {
    if (
      this.deviceState.isSafari ||
      localStorage.getItem('onboarding_default')
    ) {
      return of(true);
    }
    return callServiceEvent(this.eventService, new OnboardingRequest());
  }

  private checkSafari() {
    if (!this.deviceState.isSafari) {
      return of(true);
    }
    callServiceEvent(
      this.eventService,
      new SafariUnsupportedRequest(),
    ).subscribe();
    return of(true);
  }
}
