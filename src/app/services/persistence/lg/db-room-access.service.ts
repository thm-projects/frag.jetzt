import { Injectable } from '@angular/core';
import { LgDbBaseService } from './lg-db-base.service';

@Injectable({
  providedIn: 'root',
})
export class DbRoomAccessService extends LgDbBaseService<'room-access'> {
  constructor() {
    super('room-access');
  }
}
