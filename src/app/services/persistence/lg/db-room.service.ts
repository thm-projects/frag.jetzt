import { Injectable } from '@angular/core';
import { LgDbBaseService } from './lg-db-base.service';

@Injectable({
  providedIn: 'root',
})
export class DbRoomService extends LgDbBaseService<'room'> {
  constructor() {
    super('room');
  }
}
