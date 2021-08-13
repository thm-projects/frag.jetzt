import { Injectable } from '@angular/core';
import { JoyrideService } from 'ngx-joyride';
import { AppComponent } from '../../app.component';
import { EventService } from './event.service';
import { AuthenticationService } from '../http/authentication.service';
import { Router } from '@angular/router';
import { DataStoreService } from './data-store.service';
import { Subscription } from 'rxjs';
import { initDefaultTour, OnboardingTour, OnboardingTourStepInteraction } from './onboarding.tours';
import { JoyrideStepInfo } from 'ngx-joyride/lib/models/joyride-step-info.class';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  private _activeTour: OnboardingTour;
  private _eventServiceSubscription: Subscription;
  private _tourSubscription: Subscription;
  private _currentStep: number;

  constructor(private joyrideService: JoyrideService,
              private eventService: EventService,
              private dataStoreService: DataStoreService,
              private authenticationService: AuthenticationService,
              private router: Router) {
  }

  startDefaultTour(ignoreDone = false): boolean {
    return this.startOnboardingTour(
      initDefaultTour(this.authenticationService, this.dataStoreService, this.router), ignoreDone);
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
      this.dataStoreService.set('onboarding_' + this._activeTour.name, JSON.stringify({
        state: 'running',
        step: this._currentStep + stepDirection
      }));
      this.cleanup();
      document.querySelector('joyride-step').remove();
      document.querySelector('body > div.backdrop-container').remove();
      this.joyrideService.closeTour();
      this.router.navigate([current[1]]);
      return true;
    }
    return false;
  }

  private startOnboardingTour(tour: OnboardingTour, ignoreDone = false): boolean {
    if (this._activeTour) {
      this.cleanup();
      return false;
    }
    if (ignoreDone) {
      this.dataStoreService.remove('onboarding_' + tour.name);
    }
    const tourInfo = JSON.parse(this.dataStoreService.get('onboarding_' + tour.name));
    if (tourInfo && tourInfo.state !== 'running') {
      return false;
    }
    AppComponent.rescale.setDefaultScale(1);
    this._currentStep = tourInfo && tourInfo.step ? tourInfo.step : 1;
    const firstStepRoute = tour.tour[this._currentStep - 1].split('@');
    if (firstStepRoute.length > 1 && !this.router.url.endsWith('/' + firstStepRoute[1])) {
      this.router.navigate([firstStepRoute[1]]);
      return false;
    }
    this._activeTour = tour;
    if (!tourInfo && this._activeTour.startupAction) {
      this._activeTour.startupAction();
    }
    this.emulateWalkthrough();
    this._tourSubscription = this.joyrideService.startTour({
      steps: tour.tour,
      logsEnabled: true,
      stepDefaultPosition: 'center',
      startWith: this._activeTour.tour[this._currentStep - 1]
    }).subscribe(step => this.afterStepMade(step));
    this._eventServiceSubscription = this.eventService.on<string>('onboarding')
      .subscribe(action => this.checkTourEnding(action));
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
    this.cleanup();
  }

  private cleanup() {
    this._tourSubscription.unsubscribe();
    this._eventServiceSubscription.unsubscribe();
    this._activeTour = null;
  }
}
