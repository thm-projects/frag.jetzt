import { Injectable } from '@angular/core';
import { JoyrideService } from 'ngx-joyride';
import { AppComponent } from '../../app.component';
import { EventService } from './event.service';
import { AuthenticationService } from '../http/authentication.service';
import { UserRole } from '../../models/user-roles.enum';
import { Router } from '@angular/router';

type OnboardingTourFunction = (isNext: boolean) => void;

interface OnboardingTourFunctionObject {
  [key: string]: OnboardingTourFunction;
}

interface OnboardingTour {
  name: string;
  tour: string[];
  tourActions?: OnboardingTourFunctionObject;
  doneAction?: (finished: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  constructor(private joyrideService: JoyrideService,
              private eventService: EventService,
              private authenticationService: AuthenticationService,
              private router: Router) {
  }

  startDefaultTour() {
    const isLoggedIn = this.authenticationService.isLoggedIn();
    this.startOnboardingTour({
      name: 'default',
      tour: [
        'greeting@home',
        'loginButtonHeader@home',
        'roomJoin@home',
        'createRoom@home',
        'introduction@home',
        'feedbackLink@home',
        'createQuestion@participant/room/Feedback/comments',
        'voting@participant/room/Feedback/comments',
        'commentFilter@participant/room/Feedback/comments',
        'commentUserNumber@participant/room/Feedback/comments',
        'optionHeader@participant/room/Feedback/comments'
      ],
      tourActions: {
        feedbackLink: (isNext) => {
          if (isLoggedIn) {
            return;
          }
          if (isNext) {
            this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe();
          } else {
            this.authenticationService.logout();
          }
        }
      },
      doneAction: (_) => {
        if (!isLoggedIn) {
          this.authenticationService.logout();
        }
        this.router.navigate(['/home']);
      }
    });
  }

  private startOnboardingTour(tour: OnboardingTour) {
    const tourInfo = JSON.parse(localStorage.getItem('onboarding_' + tour.name));
    if (tourInfo && tourInfo.state !== 'running') {
      return;
    }
    let lastNumber = 0;
    let lastName = '';
    AppComponent.rescale.setDefaultScale(1);
    const tourSubscription = this.joyrideService.startTour({
      steps: tour.tour,
      logsEnabled: true,
      stepDefaultPosition: 'center',
      waitingTime: 100,
      startWith: tourInfo ? tour.tour[tourInfo.step - 1] : undefined
    }).subscribe(step => {
      AppComponent.rescale.setDefaultScale(1);
      localStorage.setItem('onboarding_' + tour.name, JSON.stringify({ state: 'running', step: step.number }));
      const container: HTMLElement = document.querySelector('.joyride-step__holder');
      if (container.style.position === 'fixed') {
        container.classList.add('center');
      }
      const isNext = step.number > lastNumber;
      lastNumber = step.number;
      const name = lastName;
      lastName = step.name;
      if (tour.tourActions) {
        if (isNext && tour.tourActions[step.name]) {
          tour.tourActions[step.name](true);
        } else if (!isNext && tour.tourActions[name]) {
          tour.tourActions[name](false);
        }
      }
    });
    const eventServiceSubscription = this.eventService.on<string>('onboarding').subscribe(action => {
      localStorage.setItem('onboarding_' + tour.name, JSON.stringify({ state: action }));
      AppComponent.rescale.setDefaultScale(AppComponent.rescale.getInitialScale());
      tourSubscription.unsubscribe();
      eventServiceSubscription.unsubscribe();
      if (tour.doneAction) {
        tour.doneAction(action === 'finished');
      }
    });
  }
}
