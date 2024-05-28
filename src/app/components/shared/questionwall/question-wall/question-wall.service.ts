import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ForumComment } from '../../../../utils/data-accessor';

@Injectable({
  providedIn: 'root',
})
export class QuestionWallService {
  public readonly focus: BehaviorSubject<ForumComment | undefined> =
    new BehaviorSubject(undefined);

  constructor() {}
}
