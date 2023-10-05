import { Injectable } from '@angular/core';
import { LgDbBaseService } from './lg-db-base.service';

@Injectable({
  providedIn: 'root',
})
export class DbReadMotdService extends LgDbBaseService<'read-motd'> {
  constructor() {
    super('read-motd');
  }
}
