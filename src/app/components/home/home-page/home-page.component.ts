import {
  Component,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  Renderer2,
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
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { applyDefaultNavigation } from 'app/navigation/default-navigation';
import { windowWatcher } from '../../../../modules/navigation/utils/window-watcher';
import { language } from 'app/base/language/language';
import { HomePageService } from './home-page.service';
import { MatDialog } from '@angular/material/dialog';
import { M3WindowSizeClass } from 'modules/m3/components/navigation/m3-navigation-types';
import { FirstTimeUserComponent } from '../_dialogs/first-time-user/first-time-user.component';

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
  listenerFn: () => void;
  accumulatedRatings: RatingResult;

  protected isMobile = () => {
    const state = windowWatcher.windowState();
    return state === 'compact' || state === 'medium';
  };
  protected readonly language = language;
  protected readonly Math = Math;
  private readonly _destroyer: Subject<number> = new ReplaySubject(1);
  private injector = inject(Injector);
  protected featureState: boolean = false;
  protected readonly windowClass = windowWatcher.windowState;

  constructor(
    private translateService: TranslateService,
    private eventService: EventService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2,
    private ratingService: RatingService,
    private sessionService: SessionService,
    private notificationService: NotificationService,
    protected self: HomePageService,
    public dialog: MatDialog,
  ) {
    this.emitNavigation();
    inject(OnboardingService);
    self.featureState
      .pipe(takeUntil(this._destroyer))
      .subscribe((featureState) => {
        this.featureState = featureState;
      });
  }

  ngOnInit() {
    this.ratingService.getRatings().subscribe((r) => {
      this.accumulatedRatings = r;
    });
    this.sessionService.onReady.subscribe(() => {
      this.loadListener();
    });
    this.eventService.on('not-authorized').subscribe(() => {
      this.translateService
        .get('login.not-authorized')
        .subscribe((msg) => this.notificationService.show(msg));
    });

    const firstTime = this.self.isFirstTimeVisitor();
    const isExtraLarge = this.windowClass() === M3WindowSizeClass.ExtraLarge;
    if (firstTime && isExtraLarge) {
      this.dialog.open(FirstTimeUserComponent, {
        backdropClass: 'blur-background',
      });
    }
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
    this._destroyer.complete();
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
