import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { RoomDataFilter } from 'app/utils/data-filter-object.lib';
import { Storable } from 'app/utils/ts-utils';
import { FormalityType } from '../http/deep-l.service';

export interface SavedRoomSettings {
  // keys
  accountId: string;
  roomId: string;
  // settings
  pseudonym?: string;
  formality?: FormalityType;
  filter?: Omit<Storable<RoomDataFilter>, 'name'>;
}

@Injectable({
  providedIn: 'root',
})
export class DBLocalRoomSettingsService {
  constructor(private indexedDb: NgxIndexedDBService) {}

  getAllByAccount(accountId: string) {
    return this.indexedDb.getAllByIndex<SavedRoomSettings>(
      'localRoomSettings',
      'accountId',
      IDBKeyRange.only(accountId),
    );
  }

  getSettings(roomId: string, accountId: string) {
    return this.indexedDb.getByKey<SavedRoomSettings>('localRoomSettings', [
      roomId,
      accountId,
    ]);
  }

  setOrUpdateSettings(settings: SavedRoomSettings) {
    return this.indexedDb.update<SavedRoomSettings>(
      'localRoomSettings',
      settings,
    );
  }
}
