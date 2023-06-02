import { Injectable } from '@angular/core';
import { RoomDataFilter } from 'app/utils/data-filter-object.lib';
import { Storable } from 'app/utils/ts-utils';
import { FormalityType } from '../http/deep-l.service';
import { PersistentDataService } from '../util/persistent-data.service';

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
  constructor(private persistentDataService: PersistentDataService) {}

  getAllByAccount(accountId: string) {
    return this.persistentDataService.getAllByIndex<SavedRoomSettings>(
      'localRoomSettings',
      'accountId',
      IDBKeyRange.only(accountId),
    );
  }

  getSettings(roomId: string, accountId: string) {
    return this.persistentDataService.getByKey<SavedRoomSettings>(
      'localRoomSettings',
      [roomId, accountId],
    );
  }

  setOrUpdateSettings(settings: SavedRoomSettings) {
    return this.persistentDataService.update<SavedRoomSettings>(
      'localRoomSettings',
      settings,
    );
  }
}
