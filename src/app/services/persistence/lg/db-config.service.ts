import { Injectable } from '@angular/core';
import { LgDbBaseService } from './lg-db-base.service';

@Injectable({
  providedIn: 'root',
})
export class DbConfigService extends LgDbBaseService<'config'> {
  constructor() {
    super('config');
  }
}
