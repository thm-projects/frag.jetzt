import { Injectable } from '@angular/core';
import { MotdAPI, MotdService } from '../http/motd.service';
import { Observable, of, ReplaySubject, switchMap, tap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';
import { ConfigurationService } from './configuration.service';
import { ThemeService } from '../../../theme/theme.service';
import { catchError, map } from 'rxjs/operators';
import { MatomoTrackingService } from './matomo-tracking.service';
import { TitleService } from './title.service';
import { NotifyUnsupportedBrowserComponent } from '../../components/home/_dialogs/notify-unsupported-browser/notify-unsupported-browser.component';
import { MatDialog } from '@angular/material/dialog';
import { DeviceInfoService } from './device-info.service';
import { SessionService } from './session.service';
import { UserManagementService } from './user-management.service';
import { DSGVOService } from './dsgvo.service';
import { CookiesComponent } from '../../components/home/_dialogs/cookies/cookies.component';
import { OverlayComponent } from '../../components/home/_dialogs/overlay/overlay.component';
import { OnboardingService } from './onboarding.service';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user';
import { StyleService } from '../../../../projects/ars/src/lib/style/style.service';
import {
  MotdDialogRequest,
  sendEvent,
} from '../../utils/service-component-events';
import { EventService } from './event.service';
import { TimeoutHelper } from '../../utils/ts-utils';
import { AskOnboardingComponent } from 'app/components/home/_dialogs/ask-onboarding/ask-onboarding.component';
import { PersistentDataService } from './persistent-data.service';

@Injectable({
  providedIn: 'root',
})
export class StartUpService {
  private _hasUnreadMotds = false;
  private _unreadMotds = new ReplaySubject<boolean>(1);

  /*
  On start:
    - check language & theme
    - check cookie & data protection
    - try login user
      - when error and needed
    - safari?
    - async
      => onboarding
      => news
   */
  constructor(
    private eventService: EventService,
    private configurationService: ConfigurationService,
    private deviceInfo: DeviceInfoService,
    private translateService: TranslateService,
    private languageService: LanguageService,
    private themeService: ThemeService,
    private styleService: StyleService,
    private userManagementService: UserManagementService,
    private motdService: MotdService,
    private dialog: MatDialog,
    private onboardingService: OnboardingService,
    private _sessionService: SessionService,
    private _matomoTrackingService: MatomoTrackingService,
    private _titleService: TitleService,
    private _dsgvo: DSGVOService,
    private persistentData: PersistentDataService,
  ) {
    this.measure('Require data');
    configurationService
      .get(
        'language',
        'theme',
        'cookieAccepted',
        'guestAccount',
        'currentAccount',
      )
      .subscribe(([lang, theme, cookie, guest, acc]) => {
        this.measure('Language and Theme');
        this.checkLanguageAndTheme(lang, theme)
          .pipe(
            switchMap(() => {
              this.measure('Cookie Consent');
              return this.checkCookieAndProtectionConsent(cookie);
            }),
            switchMap(() => {
              this.measure('Account Login');
              return this.checkAccount(guest, acc);
            }),
            /*
            switchMap(() => {
              this.measure('Safari check');
              return this.checkSafari();
            }),
            */
            switchMap(() => {
              this.measure('Onboarding interactions');
              return this.startOnboarding();
            }),
            catchError((e) => {
              console.error('error on startup:', e);
              return of(true);
            }),
          )
          .subscribe(() => {
            this.measure('End Sync');
            this.startAsync();
          });
      });
  }

  readMOTD(motdIds: string[]) {
    this.userManagementService.readMOTDs(motdIds);
    this.getMotds().subscribe((data) => this.checkNew(data));
  }

  setMotdUnread(motdId: string) {
    this.userManagementService.unreadMOTD(motdId);
    if (this._hasUnreadMotds !== true) {
      this._hasUnreadMotds = true;
      this._unreadMotds.next(true);
    }
  }

  openMotdDialog() {
    this.getMotds().subscribe((data) => {
      sendEvent(this.eventService, new MotdDialogRequest(data));
    });
  }

  unreadMotds(): Observable<boolean> {
    return this._unreadMotds;
  }

  private startAsync() {
    this.measure('Start Session service');
    this._sessionService.init();
    this.measure('Start Motd');
    this.updateNews();
    this.measure('End', true);
  }

  private checkSafari(): Observable<any> {
    if (!this.deviceInfo.isSafari) {
      return of(true);
    }
    return new Observable<any>((subscriber) => {
      const ref = this.dialog.open(NotifyUnsupportedBrowserComponent, {
        width: '600px',
      });
      ref.afterClosed().subscribe(() => {
        subscriber.next(1);
        subscriber.complete();
      });
    });
  }

  private checkAccount(guest: User, account: User): Observable<any> {
    return this.userManagementService.init(guest, account);
  }

  private checkCookieAndProtectionConsent(cookie: boolean): Observable<any> {
    if (cookie) {
      return of(true);
    }
    return this.showCookieModal().pipe(
      tap(() =>
        this.configurationService.put('cookieAccepted', true).subscribe(),
      ),
    );
  }

  private showCookieModal(): Observable<any> {
    const dialogRef = this.dialog.open(CookiesComponent, {
      width: '80%',
      maxWidth: '600px',
      autoFocus: true,
    });
    dialogRef.disableClose = true;
    return dialogRef.afterClosed().pipe(
      switchMap((d) => {
        if (!d) {
          return this.showOverlay(() => this.showCookieModal());
        }
        return of(d);
      }),
    );
  }

  private startOnboarding() {
    if (
      this.deviceInfo.isSafari ||
      localStorage.getItem('onboarding_default')
    ) {
      return of(true);
    }
    const dialogRef = this.dialog.open(AskOnboardingComponent, {
      width: '80%',
      maxWidth: '600px',
      autoFocus: true,
    });
    dialogRef.disableClose = true;
    return dialogRef.afterClosed().pipe(
      tap((data) => {
        if (!data) {
          localStorage.setItem(
            'onboarding_default',
            JSON.stringify({ state: 'canceled' }),
          );
        } else {
          this.onboardingService.startDefaultTour();
        }
      }),
    );
  }

  private updateNews() {
    const WAIT_DURATION = 1_800_000;
    const SPIN_DURATION = 1_500;
    let nextFetch = 0;
    let timeout = 0 as unknown as TimeoutHelper;
    let requestTimeout = 0 as unknown as TimeoutHelper;
    let motdData;
    const request = () => {
      if (
        !this.onboardingService.isFinished() ||
        !this._sessionService.currentRole
      ) {
        requestTimeout = setTimeout(request, SPIN_DURATION);
        return;
      }
      requestTimeout = 0;
      if (this._hasUnreadMotds) {
        sendEvent(this.eventService, new MotdDialogRequest(motdData));
      }
    };
    const update = () => {
      if (!this.userManagementService.getCurrentUser()) {
        clearTimeout(timeout);
        timeout = 0;
        return;
      }
      const dateNow = Date.now();
      if (nextFetch > dateNow) {
        if (timeout === 0) {
          timeout = setTimeout(update, nextFetch - dateNow);
        }
        return;
      }
      clearTimeout(timeout);
      nextFetch = dateNow + WAIT_DURATION;
      timeout = setTimeout(update, nextFetch - dateNow);
      this.motdService.getList().subscribe((data) => {
        this.saveMotds(data);
        this.checkNew(data);
        motdData = data;
        if (requestTimeout === 0) {
          request();
        }
      });
    };
    this.userManagementService.getUser().subscribe((_) => {
      clearTimeout(requestTimeout);
      requestTimeout = 0;
      update();
    });
  }

  private showOverlay(onSuccess: () => Observable<any>): Observable<any> {
    const dialogRef = this.dialog.open(OverlayComponent, {});
    dialogRef.disableClose = true;
    return dialogRef.afterClosed().pipe(
      switchMap((d) => {
        if (d) {
          return onSuccess();
        }
        return this.leaveApp();
      }),
    );
  }

  private leaveApp(): Observable<any> {
    window.close();
    location.replace('about:blank');
    return of();
  }

  private checkLanguageAndTheme(lang: string, theme: string): Observable<any> {
    return new Observable<any>((subscriber) => {
      this.languageService.init(lang);
      this.translateService.setDefaultLang(
        this.languageService.currentLanguage(),
      );
      this.themeService.init(theme);
      this.styleService.init();
      subscriber.next(true);
      subscriber.complete();
    });
  }

  private saveMotds(motds: MotdAPI[]) {
    this.getMotds().subscribe((oldMotds) => {
      const newMotds = motds.filter((m) => {
        if (oldMotds.findIndex((o) => o.id === m.id) < 0) {
          return true;
        }
        this.persistentData.update('motd', m).subscribe();
        return false;
      });
      this.persistentData.bulkAdd('motd', newMotds).subscribe();
    });
  }

  private getMotds(): Observable<MotdAPI[]> {
    return this.persistentData.getAll('motd').pipe(
      map((motds: MotdAPI[]) => {
        motds.sort(
          (a, b) => b.startTimestamp.getTime() - a.startTimestamp.getTime(),
        );
        return motds;
      }),
    );
  }

  private checkNew(motds: MotdAPI[]) {
    const read = this.userManagementService.getCurrentUser().readMotds;
    let hasUnread = false;
    for (const motd of motds) {
      if (!read.has(motd.id)) {
        hasUnread = true;
      }
    }
    if (this._hasUnreadMotds !== hasUnread) {
      this._hasUnreadMotds = hasUnread;
      this._unreadMotds.next(hasUnread);
    }
  }

  private measure(data: string, finish = false) {
    if (environment.production) {
      return;
    }
    performance.mark('startup', {
      detail: data,
    });
    const format = (nr: number) => {
      return nr.toFixed(2) + 'ms';
    };
    if (finish) {
      const entries = performance.getEntriesByName('startup', 'mark');
      let prev = null;
      const [_, object, last] = entries.reduce(
        (acc, value) => {
          if (prev !== null) {
            prev['duration'] = format(value.startTime - acc[2]);
          }
          prev = { start: format(value.startTime) };
          acc[1][`${acc[0]++} ${value['detail']}`] = prev;
          acc[2] = value.startTime;
          return acc;
        },
        [0, {} as any, entries[0].startTime],
      );
      prev['duration'] = 'Total: ' + format(last - entries[0].startTime);
      console.table(object);
      performance.clearMarks('startup');
    }
  }
}
