import { AuthenticationService } from '../http/authentication.service';
import { UserRole } from '../../models/user-roles.enum';
import { DataStoreService } from './data-store.service';
import { Router } from '@angular/router';
import { RoomService } from '../http/room.service';
import { Observable, of, Subject } from 'rxjs';

export interface OnboardingTourStepInteraction {
  beforeLoad?: (isNext: boolean) => void;
  afterLoad?: (isNext: boolean) => void;
  beforeUnload?: (isNext: boolean) => void;
  afterUnload?: (isNext: boolean) => void;
}

export interface OnboardingTourStepInteractionObject {
  [key: string]: OnboardingTourStepInteraction;
}

export interface OnboardingTour {
  name: string;
  tour: string[];
  tourActions?: OnboardingTourStepInteractionObject;
  startupAction?: () => void;
  doneAction?: (finished: boolean) => void;
  checkIfRouteCanBeAccessed?: (route: string) => Observable<boolean>;
}

const roomChecker = (roomService: RoomService, roomUrl: string): Observable<boolean> => {
  const index = roomUrl.indexOf('room/') + 5;
  const shortId = roomUrl.substring(index, roomUrl.indexOf('/', index));
  const sub = new Subject<boolean>();
  roomService.getRoomByShortId(shortId)
    .subscribe(room => sub.next(room != null), () => sub.next(false));
  return sub.asObservable();
};

export const initDefaultTour = (authenticationService: AuthenticationService,
                                dataStoreService: DataStoreService,
                                router: Router,
                                roomService: RoomService): OnboardingTour => ({
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
    feedbackLink: {
      beforeLoad: (isNext: boolean) => {
        if (isNext && dataStoreService.get('onboarding-default-meta') === 'false' && !authenticationService.isLoggedIn()) {
          authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe();
        }
      },
      beforeUnload: (isNext: boolean) => {
        if (!isNext && dataStoreService.get('onboarding-default-meta') === 'false' && authenticationService.isLoggedIn()) {
          authenticationService.logout();
        }
      }
    },
    voting: {
      beforeLoad: () => {
        document.getElementById('scroll_container').scrollTop = 0;
      }
    }
  },
  doneAction: (_) => {
    if (dataStoreService.get('onboarding-default-meta') === 'false') {
      authenticationService.logout();
    }
    dataStoreService.remove('onboarding-default-meta');
    router.navigate(['/home']);
  },
  startupAction: () => {
    dataStoreService.set('onboarding-default-meta', String(authenticationService.isLoggedIn()));
  },
  checkIfRouteCanBeAccessed: (route: string) => {
    if (route.endsWith('home')) {
      return of(true);
    }
    return roomChecker(roomService, route);
  }
});
