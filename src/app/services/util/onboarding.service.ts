import { Injectable } from '@angular/core';
import { JoyrideService } from 'ngx-joyride';
import { AppComponent } from '../../app.component';
import { EventService } from './event.service';
import { AuthenticationService } from '../http/authentication.service';
import { Router } from '@angular/router';
import { DataStoreService } from './data-store.service';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { initDefaultTour, OnboardingTour, OnboardingTourStepInteraction } from './onboarding.tours';
import { JoyrideStepInfo } from 'ngx-joyride/lib/models/joyride-step-info.class';
import { NotificationService } from './notification.service';
import { RoomService } from '../http/room.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';
import { DeviceInfoService } from './device-info.service';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  private _activeTour: OnboardingTour;
  private _eventServiceSubscription: Subscription;
  private _tourSubscription: Subscription;
  private _currentStep: number;
  private _finishedTours: BehaviorSubject<string[]>;

  constructor(private joyrideService: JoyrideService,
              private eventService: EventService,
              private dataStoreService: DataStoreService,
              private authenticationService: AuthenticationService,
              private router: Router,
              private notificationService: NotificationService,
              private roomService: RoomService,
              private translateService: TranslateService,
              private langService: LanguageService,
              private deviceInfo: DeviceInfoService) {
    this._finishedTours = new BehaviorSubject<string[]>([]);
    this.langService.getLanguage().subscribe(lang => {
      this.translateService.use(lang);
    });
  }

  onFinishTour(name = 'default'): Observable<any> {
    const obj = JSON.parse(this.dataStoreService.get('onboarding_' + name));
    if (obj && obj.state !== 'running') {
      return of(obj.state);
    }
    return new Observable<any>(e => {
      const subscription = this._finishedTours.subscribe(tours => {
        if (tours.includes(name)) {
          e.next(true);
          e.complete();
          subscription.unsubscribe();
        }
      });
    });
  }

  startDefaultTour(ignoreDone = false): boolean {
    return this.startOnboardingTour(
      initDefaultTour(this.authenticationService, this.dataStoreService, this.roomService), ignoreDone);
  }

  doStep(stepDirection: number): boolean {
    if (!this._activeTour) {
      return false;
    }
    const previous = this._activeTour.tour[this._currentStep - 1].split('@');
    const current = this._activeTour.tour[this._currentStep - 1 + stepDirection].split('@');
    if (this._activeTour.tourActions) {
      const prevObj = this._activeTour.tourActions[previous[0]];
      const currentObj = this._activeTour.tourActions[current[0]];
      if (prevObj && prevObj.beforeUnload) {
        prevObj.beforeUnload(stepDirection === 1);
      }
      if (currentObj && currentObj.beforeLoad) {
        currentObj.beforeLoad(stepDirection === 1);
      }
    }
    if (previous.length < current.length || previous[1] !== current[1]) {
      //Route gets switched
      const name = this._activeTour.name;
      const routeChecker = this._activeTour.checkIfRouteCanBeAccessed;
      this.cleanup();
      this.joyrideService.closeTour();
      this.dataStoreService.set('onboarding_' + name, JSON.stringify({
        state: 'running',
        step: this._currentStep + stepDirection
      }));
      this.tryNavigate(name, current[1], routeChecker);
      return true;
    }
    return false;
  }

  private startOnboardingTour(tour: OnboardingTour, ignoreDone = false): boolean {
    if (this._activeTour) {
      this.cleanup();
      return false;
    } else if (this.deviceInfo.isSafari) {
      return false;
    }
    if (ignoreDone) {
      this.dataStoreService.remove('onboarding_' + tour.name);
    }
    const tourInfo = JSON.parse(this.dataStoreService.get('onboarding_' + tour.name));
    if (tourInfo && tourInfo.state !== 'running') {
      return false;
    }
    if (!this.dataStoreService.has('onboarding_' + tour.name + '_redirect')) {
      this.dataStoreService.set('onboarding_' + tour.name + '_redirect', this.router.url);
    }
    AppComponent.rescale.setDefaultScale(1);
    this._currentStep = tourInfo && tourInfo.step ? tourInfo.step : 1;
    const firstStepRoute = tour.tour[this._currentStep - 1].split('@');
    if (firstStepRoute.length > 1 && !this.router.url.endsWith('/' + firstStepRoute[1])) {
      this.tryNavigate(tour.name, firstStepRoute[1], tour.checkIfRouteCanBeAccessed);
      return false;
    }
    this._activeTour = tour;
    if (!tourInfo && this._activeTour.startupAction) {
      this._activeTour.startupAction();
    }
    this.emulateWalkthrough();
    window.addEventListener('keyup', this._keyUpWrapper);
    this._tourSubscription = this.joyrideService.startTour({
      steps: tour.tour,
      logsEnabled: false,
      stepDefaultPosition: 'center',
      startWith: this._activeTour.tour[this._currentStep - 1]
    }).subscribe(step => this.afterStepMade(step));
    this._eventServiceSubscription = this.eventService.on<string>('onboarding')
      .subscribe(action => {
        this.checkTourEnding(action);
        this._finishedTours.next(this._finishedTours.value.concat(tour.name));
      });
    return true;
  }

  private afterStepMade(step: JoyrideStepInfo) {
    AppComponent.rescale.setDefaultScale(1);
    this.dataStoreService.set('onboarding_' + this._activeTour.name, JSON.stringify({
      state: 'running',
      step: step.number
    }));
    const container: HTMLElement = document.querySelector('.joyride-step__holder');
    if (container.style.position === 'fixed') {
      container.classList.add('center');
    }
    if (!this._activeTour.tourActions) {
      return;
    }
    const previous = this._activeTour.tourActions[this._activeTour.tour[this._currentStep - 1].split('@')[0]];
    const current = this._activeTour.tourActions[step.name];
    const isNext = this._currentStep < step.number;
    this._currentStep = step.number;
    if (previous && previous.afterUnload) {
      previous.afterUnload(isNext);
    }
    if (current && current.afterLoad) {
      current.afterLoad(isNext);
    }
  }

  private tryNavigate(tourName: string, route: string, routeChecker: (string) => Observable<boolean>) {
    if (routeChecker) {
      routeChecker(route).subscribe(canAccess => {
        if (canAccess) {
          this.router.navigate([route]);
        } else {
          this.dataStoreService.set('onboarding_' + tourName, JSON.stringify({ state: 'canceled' }));
          this.translateService.get('joyride.cantAccessRoute').subscribe(message => {
            this.notificationService.show(message);
          });
        }
      });
    } else {
      this.router.navigate([route]);
    }
  }

  private emulateWalkthrough() {
    if (!this._activeTour.tourActions) {
      return;
    }
    let lastTourObject: OnboardingTourStepInteraction = null;
    let currentTourObject: OnboardingTourStepInteraction;
    for (let i = 0; i < this._currentStep; i++) {
      currentTourObject = this._activeTour.tourActions[this._activeTour.tour[i].split('@')[0]];
      if (lastTourObject && lastTourObject.beforeUnload) {
        lastTourObject.beforeUnload(true);
      }
      if (currentTourObject && currentTourObject.beforeLoad) {
        currentTourObject.beforeLoad(true);
      }
      if (lastTourObject && lastTourObject.afterUnload) {
        lastTourObject.afterUnload(true);
      }
      if (currentTourObject && currentTourObject.afterLoad) {
        currentTourObject.afterLoad(true);
      }
      lastTourObject = currentTourObject;
    }
  }

  private checkTourEnding(action: string) {
    this.dataStoreService.set('onboarding_' + this._activeTour.name, JSON.stringify({ state: action }));
    AppComponent.rescale.setDefaultScale(AppComponent.rescale.getInitialScale());
    if (this._activeTour.doneAction) {
      this._activeTour.doneAction(action === 'finished');
    }
    this.cleanup(true);
  }

  private cleanup(finished = false) {
    const redirectKey = 'onboarding_' + this._activeTour.name + '_redirect';
    const redirect = this.dataStoreService.get(redirectKey);
    this._eventServiceSubscription.unsubscribe();
    this._activeTour = null;
    if (finished) {
      this._tourSubscription.unsubscribe();
      window.removeEventListener('keyup', this._keyUpWrapper);
      this.dataStoreService.remove(redirectKey);
      this.router.navigate([redirect]);
    }
  }

  private _keyUpWrapper = (e: KeyboardEvent) => this.onKeyUp(e);

  private onKeyUp(e: KeyboardEvent) {
    if (!this._activeTour) {
      e.stopImmediatePropagation();
      return;
    }
    if (e.key === 'ArrowLeft') {
      if (this._currentStep < 2 || this.doStep(-1)) {
        e.stopImmediatePropagation();
      }
    } else if (e.key === 'ArrowRight') {
      if (this._currentStep < this._activeTour.tour.length && this.doStep(1)) {
        e.stopImmediatePropagation();
      } else if (this._currentStep === this._activeTour.tour.length) {
        this.eventService.broadcast('onboarding', 'finished');
      }
    } else if (e.key === 'Escape') {
      e.stopImmediatePropagation();
      this.joyrideService.closeTour();
    }
  }
}
