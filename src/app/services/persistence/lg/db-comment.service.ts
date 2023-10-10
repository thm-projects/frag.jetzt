import { Injectable } from '@angular/core';
import { LgDbBaseService } from './lg-db-base.service';

@Injectable({
  providedIn: 'root',
})
export class DbCommentService extends LgDbBaseService<'comment'> {
  constructor() {
    super('comment');
  }
}
