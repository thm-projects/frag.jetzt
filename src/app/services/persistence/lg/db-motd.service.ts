import { Injectable } from '@angular/core';
import { LgDbBaseService } from './lg-db-base.service';

@Injectable({
  providedIn: 'root',
})
export class DbMotdService extends LgDbBaseService<'motd'> {
  constructor() {
    super('motd');
  }
}
