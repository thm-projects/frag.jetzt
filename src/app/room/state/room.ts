import { computed, signal } from '@angular/core';
import { getInjector } from 'app/base/angular-init';
import {
  ConnectionService,
  ConnectionStatus,
  INFOS,
} from 'app/base/connectivity/connectivity';
import { dataService } from 'app/base/db/data-service';
import { Moderator } from 'app/models/moderator';
import { Room } from 'app/models/room';
import { User } from 'app/models/user';
import { ModeratorService } from 'app/services/http/moderator.service';
import { RoomService } from 'app/services/http/room.service';
import { user } from 'app/user/state/user';
import { fetchingSignal } from 'app/utils/fetching-signal';
import { of, switchMap, tap } from 'rxjs';

// short id

const shortIdSignal = signal<string>(null);
export const shortId = shortIdSignal.asReadonly();

export const enterRoom = (shortId: string) => {
  shortIdSignal.set(shortId);
};

// room - fetching

const isAvailable = computed(
  () =>
    INFOS[ConnectionService.WebSocket].status() === ConnectionStatus.Available,
);

export const room = fetchingSignal<[string, boolean, User], Room>({
  initialState: null,
  fetchingState: () => null,
  fetch: ([shortId, wsReady, user]) => {
    if (!wsReady || !shortId || !user) {
      return of(null);
    }
    return getInjector().pipe(
      switchMap((injector) => {
        const roomService = injector.get(RoomService);
        return roomService.getRoomByShortId(shortId);
      }),
      tap((room) => dataService.room.createOrUpdate(room).subscribe()),
    );
  },
  provider: computed(() => [shortId(), isAvailable(), user()]),
});

// moderators - fetching

export const moderators = fetchingSignal<Room, Moderator[]>({
  initialState: null,
  fetchingState: () => null,
  fetch: (room) => {
    if (!room) {
      return of(null);
    }
    return getInjector().pipe(
      switchMap((injector) => injector.get(ModeratorService).get(room.id)),
    );
  },
  provider: room,
});
