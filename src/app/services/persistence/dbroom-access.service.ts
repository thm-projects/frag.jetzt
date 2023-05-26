import { Injectable } from '@angular/core';
import { UserRole } from '../../models/user-roles.enum';
import { PersistentDataService } from '../util/persistent-data.service';
import { tap } from 'rxjs';

export interface SavedRoomAccess {
  userId: string;
  roomShortId: string;
  roomId: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root',
})
export class DBRoomAccessService {
  constructor(private persistentDataService: PersistentDataService) {}

  getAllByUser(userId: string) {
    return this.persistentDataService.getAllByIndex<SavedRoomAccess>(
      'roomAccess',
      'userId',
      IDBKeyRange.only(userId),
    );
  }

  getByUserAndShortId(userId: string, shortId: string) {
    return this.persistentDataService.getByKey<SavedRoomAccess>('roomAccess', [
      userId,
      shortId,
    ]);
  }

  updateEntry(access: SavedRoomAccess) {
    return this.persistentDataService.update<SavedRoomAccess>(
      'roomAccess',
      access,
    );
  }
}
