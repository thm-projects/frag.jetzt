import {
  ApplicationRef,
  Component,
  computed,
  ElementRef,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SwPush, SwUpdate } from '@angular/service-worker';
import { NotificationService } from './services/util/notification.service';
import { CustomIconService } from './services/util/custom-icon.service';
import { filter, first, map, switchMap, take } from 'rxjs/operators';
import { EventService } from './services/util/event.service';
import {
  CookieDialogRequest,
  CookieDialogResponse,
  listenEvent,
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
  sendEvent,
} from './utils/service-component-events';
import { LoginComponent } from './components/shared/login/login.component';
import { MotdDialogComponent } from './components/shared/_dialogs/motd-dialog/motd-dialog.component';
import { Router } from '@angular/router';
import { UpdateInfoDialogComponent } from './components/home/_dialogs/update-info-dialog/update-info-dialog.component';
import { LivepollDialogComponent } from './components/shared/_dialogs/livepoll/livepoll-dialog/livepoll-dialog.component';
import { LivepollCreateComponent } from './components/shared/_dialogs/livepoll/livepoll-create/livepoll-create.component';
import { LivepollSummaryComponent } from './components/shared/_dialogs/livepoll/livepoll-summary/livepoll-summary.component';
import { LivepollPeerInstructionComparisonComponent } from './components/shared/_dialogs/livepoll/livepoll-peer-instruction/livepoll-peer-instruction-comparison/livepoll-peer-instruction-comparison.component';
import { CookiesComponent } from './components/home/_dialogs/cookies/cookies.component';
import { concat, interval, Observable, of } from 'rxjs';
import { OverlayComponent } from './components/home/_dialogs/overlay/overlay.component';
import { UUID } from './utils/ts-utils';
import { DeviceStateService } from './services/state/device-state.service';
import { AskOnboardingComponent } from './components/home/_dialogs/ask-onboarding/ask-onboarding.component';
import { OnboardingService } from './services/util/onboarding.service';
import { NotifyUnsupportedBrowserComponent } from './components/home/_dialogs/notify-unsupported-browser/notify-unsupported-browser.component';
import { InitService } from './services/util/init.service';
import { MatomoTrackingService } from './services/util/matomo-tracking.service';
import {
  WebPushService,
  WebPushSubscription,
} from './services/http/web-push.service';
import { MatDialog } from '@angular/material/dialog';
import { SessionService } from './services/util/session.service';
import { RoomService } from './services/http/room.service';
import { UserService } from './services/http/user.service';
import { Room } from './models/room';
import { CommentService } from './services/http/comment.service';
import { Comment, Language } from './models/comment';
import { generateConsequentlyUUID } from './utils/test-utils';
import { CorrectWrong } from './models/correct-wrong.enum';
import { dataService } from './base/db/data-service';
import { windowWatcher } from '../modules/navigation/utils/window-watcher';
import { lorem } from './utils/lorem';
import { user } from './user/state/user';
import { KeycloakRoles } from './models/user';

const PUSH_KEY = 'push-subscription';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
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
  private _lastClass: string;
  private usingDebugger = signal(true);
  protected readonly canUseDebugger = computed(
    () => this.usingDebugger() && user()?.hasRole(KeycloakRoles.AdminDashboard),
  );
  __debugger = {
    isExtended: false,
    __loadDebug: function () {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let __debug: any = localStorage.getItem('__debug');
        if (__debug) {
          __debug = {
            ...createDefault(),
            ...JSON.parse(__debug),
          };
        } else {
          __debug = createDefault();
          localStorage.setItem('__debug', JSON.stringify(__debug));
        }
        return __debug;
      } catch (e) {
        console.error(e);
      }

      function createDefault() {
        return {
          highlight: false,
          border: false,
          isExtended: false,
        };
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __revalidateState: function (state: any) {
      if (state['highlight']) {
        document.documentElement.classList.add('debug');
      } else {
        document.documentElement.classList.remove('debug');
      }
      if (state['border']) {
        document.body.classList.add('border');
      } else {
        document.body.classList.remove('border');
      }
      this.isExtended = !!state['isExtended'];
      localStorage.setItem('__debug', JSON.stringify(state));
    },
    toggleHighlight: function () {
      const state = this.__loadDebug();
      console.log(state);
      if (state) {
        state['highlight'] = !state['highlight'];
        this.__revalidateState(state);
      }
    },
    toggleBorder: function () {
      const state = this.__loadDebug();
      console.log(state);
      if (state) {
        state['border'] = !state['border'];
        this.__revalidateState(state);
      }
    },
    load: function () {
      const state = this.__loadDebug();
      if (state) {
        this.__revalidateState(state);
      }
    },
    __options: {
      highlight: () => this.__debugger.toggleHighlight(),
      border: () => this.__debugger.toggleBorder(),
      toggleExtension: () => {
        const state = this.__debugger.__loadDebug();
        if (state) {
          state.isExtended = !this.__debugger.isExtended;
          this.__debugger.__revalidateState(state);
        }
      },
      disableExtension: () => {
        this.usingDebugger.set(false);
      },
      generateRandomRoom: () => {
        this._roomService
          .addRoom(
            new Room({
              name: (() => {
                const roomNames = ['yeet'];
                return roomNames[Math.floor(Math.random() * roomNames.length)];
              })(),
              tags: [],
              shortId: undefined,
              directSend: true,
            }),
          )
          .subscribe((result) => {
            console.log(result);
          });
      },
      generateRandomComment: () => {
        const comment = new Comment({
          id: generateConsequentlyUUID(),
          roomId: this._sessionService.currentRoom.id,
          creatorId: generateConsequentlyUUID(),
          number: '1',
          body: lorem(Math.floor(Math.random() * 20)),
          ack: true,
          correct: CorrectWrong.NULL,
          favorite: false,
          read: false,
          tag: 'Test',
          createdAt: new Date(),
          bookmark: true,
          keywordsFromQuestioner: [],
          keywordsFromSpacy: [
            {
              text: 'Hallo!',
              dep: ['ROOT'],
            },
          ],
          score: 5,
          upvotes: 10,
          downvotes: 5,
          language: Language.AUTO,
          questionerName: 'Test-Author',
          updatedAt: null,
          commentReference: null,
          deletedAt: null,
          commentDepth: 0,
          brainstormingSessionId: null,
          brainstormingWordId: null,
          approved: true,
          gptWriterState: 2,
        });
        this._commentService.addComment(comment).subscribe(() => {
          this._commentService
            .addComment(
              new Comment({
                id: generateConsequentlyUUID(),
                roomId: this._sessionService.currentRoom.id,
                creatorId: generateConsequentlyUUID(),
                number: '1',
                body: lorem(Math.floor(Math.random() * 20) + 10),
                ack: true,
                correct: CorrectWrong.NULL,
                favorite: false,
                read: false,
                tag: 'Test',
                createdAt: new Date(),
                bookmark: true,
                keywordsFromQuestioner: [],
                keywordsFromSpacy: [
                  {
                    text: 'Hallo!',
                    dep: ['ROOT'],
                  },
                ],
                score: 5,
                upvotes: 10,
                downvotes: 5,
                language: Language.AUTO,
                questionerName: 'Test-Author',
                updatedAt: null,
                commentReference: comment.id,
                deletedAt: null,
                commentDepth: 0,
                brainstormingSessionId: null,
                brainstormingWordId: null,
                approved: true,
                gptWriterState: 2,
              }),
            )
            .subscribe((x) => {
              console.log(x);
            });
        });
      },
      gotoHome: () => {
        this.router.navigate(['home']);
      },
      gotoComponentTest: () => {
        this.router.navigate(['creator', 'component-test-page']);
      },
      gotoLayoutTest: () => {
        this.router.navigate(['creator', 'component-layout-test-page']);
      },
      gotoTypographyTest: () => {
        this.router.navigate(['creator', 'component-typography-test-page']);
      },
    },
    self: undefined,
  };
  protected readonly windowClass = windowWatcher.windowState;

  constructor(
    private translationService: TranslateService,
    private update: SwUpdate,
    private push: SwPush,
    public notification: NotificationService,
    private customIconService: CustomIconService,
    private eventService: EventService,
    private dialog: MatDialog,
    public router: Router,
    private onboarding: OnboardingService,
    private applicationRef: ApplicationRef,
    private webPush: WebPushService,
    deviceState: DeviceStateService,
    initService: InitService,
    matomoService: MatomoTrackingService,
    // TODO remove after refactoring
    private readonly _sessionService: SessionService,
    private readonly _roomService: RoomService,
    private readonly _userService: UserService,
    private readonly _commentService: CommentService,
  ) {
    this.__debugger.load();
    this.__debugger.self = Object.entries(this.__debugger.__options);
    AppComponent.instance = this;
    this.initDialogsForServices();
    customIconService.init();
    deviceState.mobile$.subscribe((m) => (this.isMobile = m));
    initService.init();
  }

  public static scrollTop() {
    const sc: HTMLElement = document.querySelector('div.m3-nav-body');
    if (AppComponent.scrollAnimation) {
      sc.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      sc.scrollTop = 0;
    }
  }

  public static isScrolledTop(): boolean {
    return document.querySelector('div.m3-nav-body')?.scrollTop === 0;
  }

  ngOnInit(): void {
    this.initUpdates();
    this.initPush();
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
      header.classList.add('hide');
    } else {
      header.classList.remove('hide');
    }
    const height =
      scroller.scrollHeight - scroller.clientHeight - footer.offsetHeight;
    if (current > this._lastScrollTop && current < height) {
      footer.classList.add('hide');
    } else {
      footer.classList.remove('hide');
    }
    this._lastScrollTop = current;
  }

  registerPush() {
    this.webPush
      .getPublicKey()
      .pipe(
        // Will error when fail
        switchMap((key) => {
          return this.push.requestSubscription({ serverPublicKey: key });
        }),
        switchMap((sub) => {
          return this.savePush(WebPushSubscription.fromPushSubscription(sub));
        }),
      )
      .subscribe({
        next: () => {
          this.notification.show(
            this.translationService.instant('push.register-success'),
          );
        },
        error: (err) => {
          console.error(err);
          this.notification.show(
            this.translationService.instant('push.register-error'),
            undefined,
            {
              duration: 12_500,
              panelClass: ['snackbar', 'important'],
            },
          );
        },
      });
  }

  hasPushSubscription() {
    return dataService.config.get(PUSH_KEY).pipe(map((v) => Boolean(v?.value)));
  }

  private initDialogsForServices() {
    listenEvent(this.eventService, LoginDialogRequest).subscribe((request) => {
      const dialogRef = this.dialog.open(LoginComponent, {
        minHeight: 'unset',
        width: '22.5rem',
      });
      dialogRef.componentInstance.wasInactive = request.wasInactive;
      dialogRef.afterClosed().subscribe((keycloakId: UUID) => {
        sendEvent(
          this.eventService,
          new LoginDialogResponse(request, keycloakId),
        );
      });
    });
    listenEvent(this.eventService, RescaleRequest).subscribe((request) => {
      sendEvent(this.eventService, new RescaleResponse(request));
    });
    listenEvent(this.eventService, MotdDialogRequest).subscribe((req) => {
      const dialogRef = this.dialog.open(MotdDialogComponent, {
        width: '80%',
        maxWidth: '600px',
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
        minHeight: 'unset',
        autoFocus: true,
        disableClose: true,
      });
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
      minHeight: 'unset',
    });
    dialogRef.disableClose = true;
    return dialogRef
      .afterClosed()
      .pipe(switchMap((d) => (d ? of(true) : this.showOverlay())));
  }

  private showOverlay(): Observable<boolean> {
    const dialogRef = this.dialog.open(OverlayComponent, {
      minHeight: 'unset',
      disableClose: true,
    });
    return dialogRef
      .afterClosed()
      .pipe(switchMap((d) => (d ? this.showCookieModal() : of(false))));
  }

  private initUpdates() {
    if (!this.update.isEnabled) {
      return;
    }
    this.update.versionUpdates
      .pipe(filter((e) => e.type === 'VERSION_READY'))
      .subscribe(() => UpdateInfoDialogComponent.open(this.dialog));
    const appIsStable$ = this.applicationRef.isStable.pipe(
      first((isStable) => isStable === true),
    );
    const everyThreeHours$ = interval(3 * 60 * 60 * 1000);
    concat(appIsStable$, everyThreeHours$).subscribe(() => {
      this.update.checkForUpdate().then((update) => {
        if (update) {
          console.log('Software update available.');
        }
      });
    });
  }

  private initPush() {
    if (!this.push.isEnabled) {
      return;
    }
    this.push.subscription.pipe(take(1)).subscribe((sub) => {
      if (!sub) {
        // do only register when user wants that
        return;
      }
      // Check if subscription has changed or updated
      const current = WebPushSubscription.fromPushSubscription(sub);
      dataService.config
        .get(PUSH_KEY)
        .pipe(
          switchMap((entry) => {
            const oldSub = entry?.value as WebPushSubscription;
            if (
              !oldSub ||
              oldSub.endpoint !== current.endpoint ||
              oldSub.key !== current.key ||
              oldSub.auth !== current.auth
            ) {
              if (oldSub) {
                return this.deletePush(oldSub.id).pipe(
                  switchMap(() => this.savePush(current)),
                );
              }
              return this.savePush(current);
            }
            return of();
          }),
        )
        .subscribe();
    });
  }

  private deletePush(subId: WebPushSubscription['id']): Observable<void> {
    return this.webPush
      .deleteSubscription(subId)
      .pipe(switchMap(() => dataService.config.delete(PUSH_KEY)));
  }

  private savePush(sub: WebPushSubscription): Observable<unknown> {
    return this.webPush.createSubscription(sub).pipe(
      switchMap((data) =>
        dataService.config.createOrUpdate({
          key: PUSH_KEY,
          value: data,
        }),
      ),
    );
  }

  onActive($event: unknown) {
    console.log('activate', $event);
  }

  onDetach($event: unknown) {
    console.log('detach', $event);
  }

  onAttach($event: unknown) {
    console.log('attach', $event);
  }

  onDeactivate($event: unknown) {
    console.log('deactivate', $event);
  }
}
