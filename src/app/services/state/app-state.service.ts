import { Injectable } from '@angular/core';
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
import { DbConfigService } from '../persistence/lg/db-config.service';
import { DbMotdService } from '../persistence/lg/db-motd.service';
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
import { Motd } from '../persistence/lg/db-motd.model';
import { EventService } from '../util/event.service';
import { InitService } from '../util/init.service';

export const AVAILABLE_LANGUAGES = ['en', 'de', 'fr'] as const;

export type Language = (typeof AVAILABLE_LANGUAGES)[number];

export type ThemeKey = keyof typeof themes;

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  readonly language$: Observable<Language>;
  readonly appliedTheme$: Observable<ThemeKey>;
  readonly theme$: Observable<ThemeKey>;
  readonly motd$: Observable<Motd[]>;
  readonly cookiesAccepted$: Observable<boolean>;
  private readonly updateLanguage$ = new Subject<Language>();
  private readonly updateTheme$ = new Subject<ThemeKey>();
  private readonly updateCookieAccepted$ = new Subject<boolean>();

  constructor(
    private dbConfig: DbConfigService,
    private dbMotd: DbMotdService,
    private onlineState: OnlineStateService,
    private preferences: PreferenceStateService,
    private motd: MotdService,
    private deviceState: DeviceStateService,
    private eventService: EventService,
    private initService: InitService,
  ) {
    this.language$ = concat(this.loadLanguage(), this.updateLanguage$).pipe(
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.motd$ = this.onlineState
      .refreshWhenReachable(this.dbMotd.getAll(), this.fetchMotds())
      .pipe(shareReplay(1));
    this.cookiesAccepted$ = concat(
      this.dbConfig
        .get('cookieAccepted')
        .pipe(map((v) => (v?.value ?? false) as boolean)),
      this.updateCookieAccepted$,
    ).pipe(distinctUntilChanged(), shareReplay(1));
    this.theme$ = concat(
      this.dbConfig
        .get('theme')
        .pipe(map((v) => (v?.value || 'systemDefault') as ThemeKey)),
      this.updateTheme$,
    ).pipe(distinctUntilChanged(), shareReplay(1));
    this.appliedTheme$ = merge(this.theme$, this.deviceState.dark$)
      .pipe(
        map(() => {
          const theme = this.getCurrentTheme();
          if (theme !== 'systemDefault') {
            return theme;
          }
          const dark = this.deviceState.isDark();
          return themes_meta['systemDefault'].config[dark ? 'dark' : 'light'];
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
            this.dbConfig
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
      // TODO: Safari unsupported
    });
  }

  changeLanguage(language: Language) {
    this.dbConfig
      .createOrUpdate({ key: 'language', value: language })
      .subscribe(() => this.updateLanguage$.next(language));
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
    this.dbConfig
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
          const first = needsDelete ? this.dbMotd.clear() : of(undefined);
          return first;
        }),
        switchMap(() => {
          return this.dbMotd.createOrUpdateMany(
            motds.map((value) => ({ value })),
          );
        }),
      )
      .subscribe();
  }

  private loadLanguage(): Observable<Language> {
    return this.dbConfig.get('language').pipe(
      map((cfg) => {
        let lang = cfg?.value as Language;
        lang = AVAILABLE_LANGUAGES.includes(lang) ? lang : null;
        if (!lang) {
          for (const language of navigator.languages) {
            const langKey = language.split('-')[0].toLowerCase() as Language;
            if (AVAILABLE_LANGUAGES.includes(langKey)) {
              lang = langKey;
              break;
            }
          }
        }
        return lang || AVAILABLE_LANGUAGES[0];
      }),
    );
  }

  private leaveApp(): Observable<any> {
    window.close();
    location.replace('about:blank');
    return of();
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
  }
}
