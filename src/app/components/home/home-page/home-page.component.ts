import { Component, OnInit, OnDestroy, Renderer2, AfterViewInit } from '@angular/core';
import { EventService } from '../../../services/util/event.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { KeyboardUtils } from '../../../utils/keyboard';
import { KeyboardKey } from '../../../utils/keyboard/keys';
import { TranslateService } from '@ngx-translate/core';
import { OnboardingService } from '../../../services/util/onboarding.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, OnDestroy, AfterViewInit {

  deviceType: string;
  listenerFn: () => void;
  private _eventServiceSubscription: Subscription;

  constructor(
    private translateService: TranslateService,
    private eventService: EventService,
    private liveAnnouncer: LiveAnnouncer,
    private _r: Renderer2,
    private onboardingService: OnboardingService
  ) {
  }

  ngOnInit() {
    this.deviceType = localStorage.getItem('deviceType');
    if (localStorage.getItem('cookieAccepted')) {
      this.loadListener();
    } else {
      const interval = setInterval(() => {
        if (localStorage.getItem('cookieAccepted')) {
          clearInterval(interval);
          this.loadListener();
        }
      }, 100);
    }
  }

  ngAfterViewInit() {
    if (localStorage.getItem('dataProtectionConsent') === 'true') {
      this.onboardingService.startDefaultTour();
    } else {
      this._eventServiceSubscription = this.eventService.on<boolean>('dataProtectionConsentUpdate')
        .subscribe(b => {
          if (b) {
            this._eventServiceSubscription.unsubscribe();
            this._eventServiceSubscription = null;
            this.onboardingService.startDefaultTour();
          }
        });
    }
  }

  loadListener() {
    this.listenerFn = this._r.listen(document, 'keyup', (event) => {
      if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit1) === true && this.eventService.focusOnInput === false) {
        document.getElementById('session_id-input').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit3) === true && this.eventService.focusOnInput === false) {
        document.getElementById('new_session-button').focus();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Digit4) === true && this.eventService.focusOnInput === false) {
        document.getElementById('language-menu').focus();
      } else if (
        KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape, KeyboardKey.Digit9) === true && this.eventService.focusOnInput === false
      ) {
        this.announce();
      } else if (KeyboardUtils.isKeyEvent(event, KeyboardKey.Escape) === true && this.eventService.focusOnInput === true) {
        document.getElementById('session_enter-button').focus();
        this.eventService.makeFocusOnInputFalse();
      }
    });
  }

  ngOnDestroy() {
    this.listenerFn();
    this.eventService.makeFocusOnInputFalse();
    if (this._eventServiceSubscription) {
      this._eventServiceSubscription.unsubscribe();
    }
  }

  public announce() {
    const lang: string = this.translateService.currentLang;
    this.liveAnnouncer.clear();
    if (lang === 'de') {
      this.liveAnnouncer.announce('Du befindest dich auf der Startseite von fragpunktjetzt. ' +
        'Drücke die Taste 1 um einen Raum-Code einzugeben, die Taste 2 um in die Benutzer-Anmeldung ' +
        'oder das Sitzungs-Menü zu gelangen, die Taste 3 um eine neue Sitzung zu erstellen, ' +
        'die Taste 4 um zur Sprachauswahl zu gelangen, oder die Taste 9 um diese Ansage zu wiederholen.', 'assertive');
    } else {
      this.liveAnnouncer.announce('You are on the homepage of fragpunktjetzt. ' +
        'Press key 1 to enter a room code, key 2 to enter the user login ' +
        'or the session menu, press 3 to create a new session, ' +
        'Press 4 to go to the language selection menu or 9 to repeat this announcement', 'assertive');
    }
  }
}
