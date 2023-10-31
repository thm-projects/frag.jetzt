import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SwUpdate } from '@angular/service-worker';
import { NotificationService } from './services/util/notification.service';
import { Rescale } from './models/rescale';
import { CustomIconService } from './services/util/custom-icon.service';
import { filter, switchMap, tap } from 'rxjs/operators';
import { EventService } from './services/util/event.service';
import {
  CookieDialogRequest,
  CookieDialogResponse,
  LivepollDialogRequest,
  LivepollDialogResponse,
  LoginDialogRequest,
  LoginDialogResponse,
  MotdDialogRequest,
  MotdDialogResponse,
  OnboardingRequest,
  OnboardingResponse,
  RescaleRequest,
  RescaleResponse,
  SafariUnsupportedRequest,
  SafariUnsupportedResponse,
  listenEvent,
  sendEvent,
} from './utils/service-component-events';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from './components/shared/login/login.component';
import { MotdDialogComponent } from './components/shared/_dialogs/motd-dialog/motd-dialog.component';
import { Router } from '@angular/router';
import { UpdateInfoDialogComponent } from './components/home/_dialogs/update-info-dialog/update-info-dialog.component';
import { LivepollDialogComponent } from './components/shared/_dialogs/livepoll/livepoll-dialog/livepoll-dialog.component';
import { LivepollCreateComponent } from './components/shared/_dialogs/livepoll/livepoll-create/livepoll-create.component';
import { LivepollSummaryComponent } from './components/shared/_dialogs/livepoll/livepoll-summary/livepoll-summary.component';
import { LivepollPeerInstructionComparisonComponent } from './components/shared/_dialogs/livepoll/livepoll-peer-instruction/livepoll-peer-instruction-comparison/livepoll-peer-instruction-comparison.component';
import { CookiesComponent } from './components/home/_dialogs/cookies/cookies.component';
import { Observable, of } from 'rxjs';
import { OverlayComponent } from './components/home/_dialogs/overlay/overlay.component';
import { UUID } from './utils/ts-utils';
import { DeviceStateService } from './services/state/device-state.service';
import { AskOnboardingComponent } from './components/home/_dialogs/ask-onboarding/ask-onboarding.component';
import { OnboardingService } from './services/util/onboarding.service';
import { NotifyUnsupportedBrowserComponent } from './components/home/_dialogs/notify-unsupported-browser/notify-unsupported-browser.component';
import { InitService } from './services/util/init.service';
import { MatomoTrackingService } from './services/util/matomo-tracking.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public static rescale: Rescale = new Rescale();
  public static instance: AppComponent;
  private static scrollAnimation = true;
  @ViewChild('headerElement')
  headerElement: ElementRef<HTMLElement>;
  @ViewChild('footerElement')
  footerElement: ElementRef<HTMLElement>;
  @ViewChild('scrollElement')
  scrollElement: ElementRef<HTMLElement>;
  title = 'frag.jetzt';
  rescaleActive: boolean = false;
  isMobile = false;
  private _lastScrollTop = 0;

  constructor(
    private translationService: TranslateService,
    private update: SwUpdate,
    public notification: NotificationService,
    private customIconService: CustomIconService,
    private eventService: EventService,
    private dialog: MatDialog,
    public router: Router,
    private onboarding: OnboardingService,
    deviceState: DeviceStateService,
    initService: InitService,
    _matomoService: MatomoTrackingService,
  ) {
    AppComponent.instance = this;
    this.initDialogsForServices();
    customIconService.init();
    deviceState.mobile$.subscribe((m) => (this.isMobile = m));
    initService.init();
  }

  public static scrollTop() {
    const sc: HTMLElement = document.getElementById('scroll_container');
    if (AppComponent.scrollAnimation) {
      sc.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      sc.scrollTop = 0;
    }
  }

  public static isScrolledTop(): boolean {
    return document.getElementById('scroll_container').scrollTop === 0;
  }

  ngOnInit(): void {
    this.update.versionUpdates
      .pipe(filter((e) => e.type === 'VERSION_READY'))
      .subscribe((_) => UpdateInfoDialogComponent.open(this.dialog));
  }

  public getRescale(): Rescale {
    return AppComponent.rescale;
  }

  onScroll() {
    const scroller = this.scrollElement.nativeElement;
    const current = scroller.scrollTop;
    if (Math.abs(this._lastScrollTop - current) <= 10 && current > 0) {
      return;
    }
    const header = this.headerElement.nativeElement;
    const footer = this.footerElement.nativeElement;
    if (current > this._lastScrollTop && current > header.offsetHeight) {
      header.style.marginTop = '-' + header.offsetHeight + 'px';
    } else {
      header.style.marginTop = '0';
    }
    const height =
      scroller.scrollHeight - scroller.clientHeight - footer.offsetHeight;
    if (current > this._lastScrollTop && current < height) {
      footer.style.marginBottom = '-' + footer.offsetHeight + 'px';
    } else {
      footer.style.marginBottom = '0';
    }
    this._lastScrollTop = current;
  }

  private initDialogsForServices() {
    listenEvent(this.eventService, LoginDialogRequest).subscribe((request) => {
      const dialogRef = this.dialog.open(LoginComponent, {
        width: '350px',
      });
      dialogRef.componentInstance.redirectUrl = request.redirectUrl;
      dialogRef.afterClosed().subscribe((keycloakId: UUID) => {
        sendEvent(
          this.eventService,
          new LoginDialogResponse(request, keycloakId),
        );
      });
    });
    listenEvent(this.eventService, RescaleRequest).subscribe((request) => {
      let scale;
      if (request.scale === 'initial') {
        scale = this.getRescale().getInitialScale();
      } else {
        scale = request.scale;
      }
      this.getRescale().setScale(scale);
      sendEvent(this.eventService, new RescaleResponse(request));
    });
    listenEvent(this.eventService, MotdDialogRequest).subscribe((req) => {
      const dialogRef = this.dialog.open(MotdDialogComponent, {
        width: '80%',
        maxWidth: '600px',
        minHeight: '95%',
        height: '95%',
      });
      dialogRef.componentInstance.motds = req.motds;
      dialogRef.afterClosed().subscribe(() => {
        sendEvent(this.eventService, new MotdDialogResponse(req));
      });
    });
    listenEvent(this.eventService, CookieDialogRequest).subscribe((req) => {
      this.showCookieModal().subscribe((returnValue) =>
        sendEvent(
          this.eventService,
          new CookieDialogResponse(req, returnValue),
        ),
      );
    });
    listenEvent(this.eventService, LivepollDialogRequest).subscribe((req) => {
      switch (req.dialog) {
        case 'dialog':
          sendEvent(
            this.eventService,
            new LivepollDialogResponse(
              req,
              this.dialog.open(LivepollDialogComponent, req.config),
            ),
          );
          break;
        case 'create':
          sendEvent(
            this.eventService,
            new LivepollDialogResponse(
              req,
              this.dialog.open(LivepollCreateComponent, req.config),
            ),
          );
          break;
        case 'summary':
          sendEvent(
            this.eventService,
            new LivepollDialogResponse(
              req,
              this.dialog.open(LivepollSummaryComponent, req.config),
            ),
          );
          break;
        case 'comparison':
          sendEvent(
            this.eventService,
            new LivepollDialogResponse(
              req,
              this.dialog.open(
                LivepollPeerInstructionComparisonComponent,
                req.config,
              ),
            ),
          );
          break;
        default:
          throw new Error('Should not happen');
      }
    });
    listenEvent(this.eventService, OnboardingRequest).subscribe((request) => {
      const dialogRef = this.dialog.open(AskOnboardingComponent, {
        width: '80%',
        maxWidth: '600px',
        autoFocus: true,
      });
      dialogRef.disableClose = true;
      dialogRef.afterClosed().subscribe((data) => {
        sendEvent(this.eventService, new OnboardingResponse(request));
        if (!data) {
          localStorage.setItem(
            'onboarding_default',
            JSON.stringify({ state: 'canceled' }),
          );
        } else {
          this.onboarding.startDefaultTour();
        }
      });
    });
    listenEvent(this.eventService, SafariUnsupportedRequest).subscribe(
      (request) => {
        const ref = this.dialog.open(NotifyUnsupportedBrowserComponent, {
          width: '600px',
        });
        ref.afterClosed().subscribe(() => {
          sendEvent(this.eventService, new SafariUnsupportedResponse(request));
        });
      },
    );
  }

  private showCookieModal(): Observable<boolean> {
    const dialogRef = this.dialog.open(CookiesComponent, {
      width: '80%',
      maxWidth: '600px',
      autoFocus: true,
    });
    dialogRef.disableClose = true;
    return dialogRef
      .afterClosed()
      .pipe(switchMap((d) => (d ? of(true) : this.showOverlay())));
  }

  private showOverlay(): Observable<boolean> {
    const dialogRef = this.dialog.open(OverlayComponent, {});
    dialogRef.disableClose = true;
    return dialogRef
      .afterClosed()
      .pipe(switchMap((d) => (d ? this.showCookieModal() : of(false))));
  }
}
