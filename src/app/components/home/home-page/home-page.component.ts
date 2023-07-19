import {
  Component,
  ElementRef,
  HostListener,
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
import { LanguageService } from 'app/services/util/language.service';
import { filter, ReplaySubject, Subject, take } from 'rxjs';
import { ThemeService } from '../../../../theme/theme.service';
import { carousel } from './home-page-carousel';

export type CarouselEntryKind = 'highlight' | 'peek' | 'hidden';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: [
    './home-page.component.scss',
    '../../shared/utility/style/common-style.scss',
  ],
})
export class HomePageComponent implements OnInit, OnDestroy {
  @ViewChild('carouselScrollElement')
  _carouselScrollElement: ElementRef<HTMLDivElement>;
  listenerFn: () => void;

  accumulatedRatings: RatingResult;

  protected carouselIndex: number = 0;
  protected readonly mobileBoundaryWidth = 600;
  protected readonly mobileBoundaryHeight = 630;
  protected carousel = carousel;

  private currentTheme: string;
  private readonly _destroyer: Subject<number> = new ReplaySubject(1);
  private lastScrollMs: number = -1;

  constructor(
    private translateService: TranslateService,
    private eventService: EventService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2,
    private ratingService: RatingService,
    private sessionService: SessionService,
    private onboardingService: OnboardingService,
    private notificationService: NotificationService,
    public readonly languageService: LanguageService,
    public readonly themeService: ThemeService,
  ) {
    themeService.getTheme().subscribe((x) => (this.currentTheme = x.key));
    const arrowEventListener = (event: KeyboardEvent) => {
      if (!document.activeElement.hasAttribute('mat-menu-item')) {
        switch (event.key) {
          case 'ArrowUp':
            this.setCarouselIndex(this.carouselIndex - 1);
            break;
          case 'ArrowDown':
            this.setCarouselIndex(this.carouselIndex + 1);
            break;
          case 'ArrowLeft':
            this.setCarouselIndex(this.carouselIndex - 1);
            break;
          case 'ArrowRight':
            this.setCarouselIndex(this.carouselIndex + 1);
            break;
        }
      }
    };
    window.addEventListener('keydown', arrowEventListener, true);
    this._destroyer.subscribe(() => {
      this.listenerFn?.();
      this.eventService.makeFocusOnInputFalse();
      window.removeEventListener('keydown', arrowEventListener);
    });
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

  /**
   * @desc touchpad scroll fires multiple events with different deltaY.\
   * In order to limit the request amount, a time switch is added.
   * @param wheel
   */
  @HostListener('wheel', ['$event']) _onWheel(wheel: WheelEvent) {
    if (!wheel.ctrlKey && wheel.deltaY) {
      if (
        Math.abs(wheel.deltaY) === 120 ||
        this.lastScrollMs === -1 ||
        new Date().getTime() - this.lastScrollMs > 200
      ) {
        let changed = true;
        if (wheel.deltaY > 0) {
          this.setCarouselIndex(this.carouselIndex + 1);
        } else if (wheel.deltaY < 0) {
          this.setCarouselIndex(this.carouselIndex - 1);
        } else {
          changed = false;
        }
        if (changed) {
          this.lastScrollMs = new Date().getTime();
        }
      }
    }
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

  getBackgroundStyleForEntry(i: number): any {
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

  getStyleForEntry(i: number, kind: CarouselEntryKind): any {
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
      this.onboardingService.startDefaultTour();
      this.loadListener();
    });
    this.eventService.on('not-authorized').subscribe(() => {
      this.languageService
        .getLanguage()
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

  selectEntry(i: number, entryElement: HTMLDivElement) {
    this.carouselIndex = i;
  }

  getPositionClass(i: number) {
    let _class = '';
    const offset = i - this.carouselIndex;
    if (offset === -2 || offset === 2) {
      _class = '';
    } else {
      _class += 'hide ';
    }
    if (offset === 0) _class += 'center';
    else if (offset < 0) _class += 'bottom';
    else _class += 'top';
    return _class;
  }

  private setCarouselIndex(carouselIndex: number, throwError: boolean = false) {
    if (carouselIndex < 0 || carouselIndex >= this.carousel.length) {
      if (throwError) {
        throw new Error();
      }
    } else {
      this.carouselIndex = carouselIndex;
    }
  }
}
