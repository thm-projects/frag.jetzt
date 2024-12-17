import { DataStoreService } from './data-store.service';
import { RoomService } from '../http/room.service';
import { Observable, of, Subject } from 'rxjs';
import { forceLogin, logout, user } from 'app/user/state/user';

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

const roomChecker = (
  roomService: RoomService,
  roomUrl: string,
): Observable<boolean> => {
  const index = roomUrl.indexOf('room/') + 5;
  const shortId = roomUrl.substring(index, roomUrl.indexOf('/', index));
  const sub = new Subject<boolean>();
  roomService.getRoomByShortId(shortId).subscribe({
    next: (room) => {
      sub.next(room != null);
    },
    error: () => {
      sub.next(false);
    },
  });
  console.log('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS');
  console.log(sub);
  console.log('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS');
  return sub.asObservable();
};

export const initDefaultTour = (
  dataStoreService: DataStoreService,
  roomService: RoomService,
): OnboardingTour => ({
  name: 'default',
  tour: [
    'greeting@home',
    'roomJoin@home',
    'createRoom@home',
    'createQuestion@participant/room/Feedback/comments',
    'commentFilter@participant/room/Feedback/comments',
  ],
  tourActions: {
    feedbackLink: {
      beforeLoad: (isNext: boolean) => {
        if (
          isNext &&
          dataStoreService.get('onboarding-default-meta') === 'false' &&
          !user()
        ) {
          forceLogin().subscribe();
        }
      },
      beforeUnload: (isNext: boolean) => {
        if (
          !isNext &&
          dataStoreService.get('onboarding-default-meta') === 'false' &&
          user()
        ) {
          logout();
        }
      },
    },
    voting: {
      beforeLoad: () => {
        document.querySelector('.m3-nav-body').scrollTop = 0;
      },
    },
  },
  doneAction: () => {
    if (dataStoreService.get('onboarding-default-meta') === 'false') {
      logout();
    }
    dataStoreService.remove('onboarding-default-meta');
  },
  startupAction: () => {
    dataStoreService.set('onboarding-default-meta', String(Boolean(user())));
  },
  checkIfRouteCanBeAccessed: (route: string) => {
    if (route.endsWith('home')) {
      return of(true);
    }
    return roomChecker(roomService, route);
  },
});
