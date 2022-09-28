import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { UserRole } from '../../models/user-roles.enum';

export interface SavedRoomAccess {
  userId: string;
  roomShortId: string;
  roomId: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class DBRoomAccessService {

  constructor(
    private indexedDb: NgxIndexedDBService,
  ) {
  }

  getAllByUser(userId: string) {
    return this.indexedDb.getAllByIndex<SavedRoomAccess>('roomAccess', 'userId', IDBKeyRange.only(userId));
  }

  getByUserAndShortId(userId: string, shortId: string) {
    return this.indexedDb.getByKey<SavedRoomAccess>('roomAccess', [userId, shortId]);
  }

  updateEntry(access: SavedRoomAccess) {
    return this.indexedDb.update<SavedRoomAccess>('roomAccess', access);
  }
}
