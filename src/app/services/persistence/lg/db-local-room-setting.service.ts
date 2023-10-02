import { Injectable } from '@angular/core';
import { LgDbBaseService } from './lg-db-base.service';

@Injectable({
  providedIn: 'root',
})
export class DbLocalRoomSettingService extends LgDbBaseService<'local-room-setting'> {
  constructor() {
    super('local-room-setting');
  }
}
