import { computed, signal } from '@angular/core';
import { getInjector } from 'app/base/angular-init';
import { dataService } from 'app/base/db/data-service';
import { Room } from 'app/models/room';
import { RoomService } from 'app/services/http/room.service';
import { wsReady } from 'app/user/state/websocket';
import { fetchingSignal } from 'app/utils/fetching-signal';
import { of, switchMap, tap } from 'rxjs';

// short id

const shortIdSignal = signal<string>(null);
export const shortId = shortIdSignal.asReadonly();

export const enterRoom = (shortId: string) => {
  shortIdSignal.set(shortId);
};

// room - fetching

export const room = fetchingSignal<[string, boolean], Room>({
  initialState: null,
  fetchingState: () => null,
  fetch: ([shortId, wsReady]) => {
    if (!wsReady) {
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
  provider: computed(() => [shortId(), wsReady()]),
});
