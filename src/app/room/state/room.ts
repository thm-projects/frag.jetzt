import { computed, signal } from '@angular/core';
import { getInjector } from 'app/base/angular-init';
import {
  ConnectionService,
  ConnectionStatus,
  INFOS,
} from 'app/base/connectivity/connectivity';
import { dataService } from 'app/base/db/data-service';
import { Bookmark } from 'app/models/bookmark';
import { Room } from 'app/models/room';
import { BookmarkService } from 'app/services/http/bookmark.service';
import { RoomService } from 'app/services/http/room.service';
import { fetchingSignal } from 'app/utils/fetching-signal';
import { map, of, switchMap, tap } from 'rxjs';

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
    if (!wsReady || !shortId) {
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
  provider: computed(() => [
    shortId(),
    INFOS[ConnectionService.WebSocket].status() === ConnectionStatus.Available,
  ]),
});

// userBookmarks - fetching

export const userBookmarks = fetchingSignal<Room, Map<string, Bookmark>>({
  initialState: null,
  fetchingState: () => null,
  fetch: (room) => {
    if (!room) {
      return of(null);
    }
    return getInjector().pipe(
      switchMap((injector) =>
        injector.get(BookmarkService).getByRoomId(room.id),
      ),
      map((bookmarks) => {
        const result = new Map<string, Bookmark>();
        for (const bookmark of bookmarks) {
          result.set(bookmark.commentId, bookmark);
        }
        return result;
      }),
    );
  },
  provider: room,
});
