import {
  Component,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { EventService } from '../../../services/util/event.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { TranslateService } from '@ngx-translate/core';
import { RatingService } from '../../../services/http/rating.service';
import { RatingResult } from '../../../models/rating-result';
import { SessionService } from '../../../services/util/session.service';
import { OnboardingService } from '../../../services/util/onboarding.service';
import { NotificationService } from 'app/services/util/notification.service';
import { filter, ReplaySubject, Subject, take, takeUntil } from 'rxjs';
import { ThemeService } from '../../../../theme/theme.service';
import { carousel } from './home-page-carousel';
import { AppStateService } from 'app/services/state/app-state.service';
import { Router } from '@angular/router';
import { applyDefaultNavigation } from 'app/navigation/default-navigation';
import { LanguageKey } from './home-page-types';
import { M3WindowSizeClass } from '../../../../modules/m3/components/navigation/m3-navigation-types';
import { windowWatcher } from '../../../../modules/navigation/utils/window-watcher';

export type CarouselEntryKind = 'highlight' | 'peek' | 'hidden';

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent implements OnInit, OnDestroy {
  @ViewChild('carouselScrollElement')
  _carouselScrollElement: ElementRef<HTMLDivElement>;
  @ViewChild('supportingPaneComponent', { read: HTMLElement })
  supportingPaneComponent: HTMLElement;
  tiles: Tile[] = [
    { text: 'One', cols: 3, rows: 1, color: 'lightblue' },
    { text: 'Two', cols: 1, rows: 2, color: 'lightgreen' },
    { text: 'Three', cols: 1, rows: 1, color: 'lightpink' },
    { text: 'Four', cols: 2, rows: 1, color: '#DDBDF1' },
    { text: 'One', cols: 3, rows: 1, color: 'lightblue' },
    { text: 'Two', cols: 1, rows: 2, color: 'lightgreen' },
    { text: 'Three', cols: 1, rows: 1, color: 'lightpink' },
    { text: 'Four', cols: 2, rows: 1, color: '#DDBDF1' },
    { text: 'One', cols: 3, rows: 1, color: 'lightblue' },
    { text: 'Two', cols: 1, rows: 2, color: 'lightgreen' },
    { text: 'Three', cols: 1, rows: 1, color: 'lightpink' },
    { text: 'Four', cols: 2, rows: 1, color: '#DDBDF1' },
    { text: 'One', cols: 3, rows: 1, color: 'lightblue' },
    { text: 'Two', cols: 1, rows: 2, color: 'lightgreen' },
    { text: 'Three', cols: 1, rows: 1, color: 'lightpink' },
    { text: 'Four', cols: 2, rows: 1, color: '#DDBDF1' },
  ];

  get supportingPaneOffset() {
    if (!this.supportingPaneComponent) return {};
    const rect = this.supportingPaneComponent.getBoundingClientRect();
    return {
      'left.px': rect.x,
      'top.px': rect.y,
    };
  }

  listenerFn: () => void;

  accumulatedRatings: RatingResult;

  protected carouselIndex: number = 0;
  protected readonly mobileBoundaryWidth = 600;
  protected readonly mobileBoundaryHeight = 630;
  protected carousel = carousel;

  private currentTheme: string;
  private readonly _destroyer: Subject<number> = new ReplaySubject(1);
  private lastScrollMs: number = -1;
  private router = inject(Router);
  private injector = inject(Injector);
  private _currentLanguage: LanguageKey = 'en';

  constructor(
    private translateService: TranslateService,
    private eventService: EventService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2,
    private ratingService: RatingService,
    private sessionService: SessionService,
    private onboardingService: OnboardingService,
    private notificationService: NotificationService,
    private appState: AppStateService,
    public readonly themeService: ThemeService,
  ) {
    this.emitNavigation();
    appState.language$
      .pipe(takeUntil(this._destroyer))
      .subscribe((language) => (this._currentLanguage = language));
    themeService
      .getTheme()
      .pipe(
        filter((v) => Boolean(v)),
        takeUntil(this._destroyer),
      )
      .subscribe((x) => (this.currentTheme = x.key));
  }

  get windowClass(): M3WindowSizeClass {
    return windowWatcher.windowState();
  }

  get carouselOffset() {
    if (this._carouselScrollElement) {
      const target = this._carouselScrollElement.nativeElement.children[
        this.carouselIndex
      ] as HTMLDivElement;
      return {
        'top.px': -target.offsetTop - target.offsetHeight / 2,
      };
    } else {
      return {};
    }
  }

  get currentLanguage(): LanguageKey {
    return this._currentLanguage;
  }

  getForegroundStyleForEntry(i: number, offsetLeft: number) {
    const imageTargets = this.carousel[i].images.filter((x) => !x.isBackground);
    let _override = {};
    if (imageTargets && imageTargets.length > 0) {
      const target = imageTargets[0];
      _override = {
        ..._override,
        ...target.override[this.currentTheme + '-theme'],
        ...{
          backgroundImage: target.url,
        },
      };
      if (target.override['default']) {
        _override = {
          ..._override,
          ...target.override['default'],
        };
      }
    }
    return {
      ..._override,
      ...{
        width: `calc( 100vw - ${offsetLeft}px )`,
      },
    };
  }

  getBackgroundStyleForEntry(i: number): object {
    const imageTargets = this.carousel[i].images.filter(
      (x) => !!x.isBackground,
    );
    let _override = {};
    if (imageTargets && imageTargets.length > 0) {
      const target = imageTargets[0];
      _override = {
        ..._override,
        ...target.override[this.currentTheme + '-theme'],
        ...{
          backgroundImage: target.url,
        },
      };
      if (target.override['default']) {
        _override = {
          ..._override,
          ...target.override['default'],
        };
      }
    }
    if (i < this.carouselIndex) {
      _override['opacity'] = 0;
    } else if (i > this.carouselIndex) {
      _override['opacity'] = 0;
    } else {
      _override['opacity'] = 1;
    }
    return {
      ..._override,
      ...{
        transform: `translateY(${(this.carouselIndex - i) * -1000}px)`,
      },
    };
  }

  getStyleForEntry(i: number, kind: CarouselEntryKind): object {
    switch (kind) {
      case 'highlight':
        return {};
      case 'peek':
        return {};
      case 'hidden':
        return {};
      default:
        return {};
    }
  }

  getEntryKind(i: number): CarouselEntryKind {
    if (i === this.carouselIndex) {
      return 'highlight';
    } else if (i === this.carouselIndex - 1 || i === this.carouselIndex + 1) {
      return 'peek';
    } else {
      return 'hidden';
    }
  }

  ngOnInit() {
    this.ratingService.getRatings().subscribe((r) => {
      this.accumulatedRatings = r;
    });
    this.sessionService.onReady.subscribe(() => {
      this.loadListener();
    });
    this.eventService.on('not-authorized').subscribe(() => {
      this.appState.language$
        .pipe(
          filter((v) => Boolean(v)),
          take(1),
        )
        .subscribe(() => {
          this.translateService
            .get('login.not-authorized')
            .subscribe((msg) => this.notificationService.show(msg));
        });
    });
  }

  loadListener() {
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('session_id-input').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('new_session-button').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit4) === true &&
        this.eventService.focusOnInput === false
      ) {
        document.getElementById('language-menu').focus();
      } else if (
        KeyboardUtils.isKeyEvent(
          event,
          KeyboardKey.Escape,
          KeyboardKey.Digit9,
        ) === true &&
        this.eventService.focusOnInput === false
      ) {
        this.announce();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true &&
        this.eventService.focusOnInput === true
      ) {
        document.getElementById('session_enter-button').focus();
        this.eventService.makeFocusOnInputFalse();
      }
    });
  }

  ngOnDestroy() {
    this._destroyer.next(1);
  }

  announce() {
    const lang: string = this.translateService.currentLang;
    this.liveAnnouncer.clear();
    if (lang === 'de') {
      this.liveAnnouncer.announce(
        'Du befindest dich auf der Startseite von frag jetzt. ' +
          'Drücke die Taste 1 um einen Raum-Code einzugeben, die Taste 2 um in die Benutzer-Anmeldung ' +
          'oder das Sitzungs-Menü zu gelangen, die Taste 3 um eine neue Sitzung zu erstellen, ' +
          'die Taste 4 um zur Sprachauswahl zu gelangen, oder die Taste 9 um diese Ansage zu wiederholen.',
        'assertive',
      );
    } else {
      this.liveAnnouncer.announce(
        'You are on the homepage of frag jetzt. ' +
          'Press key 1 to enter a room code, key 2 to enter the user login ' +
          'or the session menu, press 3 to create a new session, ' +
          'Press 4 to go to the language selection menu or 9 to repeat this announcement',
        'assertive',
      );
    }
  }

  private emitNavigation() {
    applyDefaultNavigation(this.injector)
      .pipe(takeUntil(this._destroyer))
      .subscribe();
  }
}
