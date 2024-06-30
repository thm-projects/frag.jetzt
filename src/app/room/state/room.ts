import { computed, signal, untracked } from '@angular/core';
import { getInjector } from 'app/base/angular-init';
import { dataService } from 'app/base/db/data-service';
import { Room } from 'app/models/room';
import { RoomService } from 'app/services/http/room.service';
import { AccountStateService } from 'app/services/state/account-state.service';
import { Subscription, first, map, switchMap, tap } from 'rxjs';

// short id

const shortIdSignal = signal<string>(null);
export const shortId = shortIdSignal.asReadonly();

export const enterRoom = (shortId: string) => {
  shortIdSignal.set(shortId);
};

export const leaveRoom = () => {
  shortIdSignal.set(null);
};

// room - fetching

interface RoomFetchInfo {
  shortId: string;
  room: Room;
}

const fetchedRoom = signal<RoomFetchInfo>({
  shortId: null,
  room: null,
});
let lastSubscription: Subscription = null;
const loadRoom = (shortId: string) => {
  fetchedRoom.set({ shortId, room: null });
  lastSubscription?.unsubscribe();
  lastSubscription = getInjector()
    .pipe(
      switchMap((injector) => {
        // TODO: Remove
        const account = injector.get(AccountStateService);
        return account.user$.pipe(
          first(Boolean),
          map(() => injector),
        );
      }),
      switchMap((injector) => {
        const roomService = injector.get(RoomService);
        return roomService.getRoomByShortId(shortId);
      }),
      tap((room) => dataService.room.createOrUpdate(room).subscribe()),
    )
    .subscribe((room) => {
      const shortId = shortIdSignal();
      if (shortId === room.shortId) {
        fetchedRoom.set({ shortId, room });
      }
    });
};

// room - computed

export const room = computed(() => {
  const shortId = shortIdSignal();
  if (!shortId) {
    return null;
  }
  const fetchInfo = fetchedRoom();
  if (fetchInfo.shortId !== shortId) {
    untracked(() => loadRoom(shortId));
    return null;
  }
  return fetchInfo.room;
});
