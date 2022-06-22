import { Injectable } from '@angular/core';
import { RatingService } from '../http/rating.service';
import { Observable, of } from 'rxjs';
import { RatingResult } from '../../models/rating-result';

@Injectable()
export class RatingServiceMock extends RatingService {

  constructor() {
    super(null);
  }

  getRatings(): Observable<RatingResult> {
    return of({ rating: 0, people: 0 });
  }
}
