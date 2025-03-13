import { Injectable } from '@angular/core';
import {
  Observable,
  Subject,
  concat,
  distinctUntilChanged,
  filter,
  map,
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
import { DeviceStateService } from './device-state.service';
import { EventService } from '../util/event.service';
import { InitService } from '../util/init.service';
import { Language, language } from 'app/base/language/language';
import { toObservable } from '@angular/core/rxjs-interop';
import { dataService } from 'app/base/db/data-service';
import { Motd } from 'app/base/db/models/db-motd';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  readonly language$ = toObservable(language);
  readonly motd$: Observable<Motd[]>;
  readonly cookiesAccepted$: Observable<boolean>;
  private readonly updateCookieAccepted$ = new Subject<boolean>();

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
    const hasValidReferrer =
      document.referrer && !document.referrer.startsWith(location.origin);
    location.replace(hasValidReferrer ? document.referrer : 'about:blank');
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
    return of(true);
  }
}
