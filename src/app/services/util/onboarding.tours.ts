import { DataStoreService } from './data-store.service';
import { RoomService } from '../http/room.service';
import { Observable, of, Subject } from 'rxjs';
import { AccountStateService } from '../state/account-state.service';

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
  return sub.asObservable();
};

export const initDefaultTour = (
  dataStoreService: DataStoreService,
  roomService: RoomService,
  accountState: AccountStateService,
): OnboardingTour => ({
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
    'dashboard@participant/room/Feedback/comments',
    'chatGPT@participant/room/Feedback/comments',
    'navigationButton@participant/room/Feedback/comments',
    'optionHeader@participant/room/Feedback/comments',
  ],
  tourActions: {
    feedbackLink: {
      beforeLoad: (isNext: boolean) => {
        if (
          isNext &&
          dataStoreService.get('onboarding-default-meta') === 'false' &&
          !accountState.getCurrentUser()
        ) {
          accountState.openGuestSession().subscribe();
        }
      },
      beforeUnload: (isNext: boolean) => {
        if (
          !isNext &&
          dataStoreService.get('onboarding-default-meta') === 'false' &&
          accountState.getCurrentUser()
        ) {
          accountState.logout();
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
      accountState.logout();
    }
    dataStoreService.remove('onboarding-default-meta');
  },
  startupAction: () => {
    dataStoreService.set(
      'onboarding-default-meta',
      String(Boolean(accountState.getCurrentUser())),
    );
  },
  checkIfRouteCanBeAccessed: (route: string) => {
    if (route.endsWith('home')) {
      return of(true);
    }
    return roomChecker(roomService, route);
  },
});
