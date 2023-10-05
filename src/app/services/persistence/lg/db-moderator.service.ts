import { Injectable } from '@angular/core';
import { LgDbBaseService } from './lg-db-base.service';

@Injectable({
  providedIn: 'root',
})
export class DbModeratorService extends LgDbBaseService<'moderator'> {
  constructor() {
    super('moderator');
  }
}
