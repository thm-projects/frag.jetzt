import { computed, inject, signal } from '@angular/core';
import {
  ConnectionService,
  ConnectionStatus,
  INFOS,
} from 'app/base/connectivity/connectivity';
import { dataService } from 'app/base/db/data-service';
import { ModeratorService } from 'app/services/http/moderator.service';
import { RoomService } from 'app/services/http/room.service';
import { user } from 'app/user/state/user';
import { computedResource } from 'app/utils/computed-resource';
import { tap } from 'rxjs';

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

export const room = computedResource({
  request: () => {
    const id = shortId();
    const wsReady = isAvailable();
    const u = user();
    if (!id || !wsReady || !u) return undefined;
    return id;
  },
  loader: (params) => {
    return inject(RoomService)
      .getRoomByShortId(params.request)
      .pipe(tap((room) => dataService.room.createOrUpdate(room).subscribe()));
  },
}).asReadonly();

// moderators - fetching

export const moderators = computedResource({
  request: () => room.value()?.id,
  loader: (params) => inject(ModeratorService).get(params.request),
});
