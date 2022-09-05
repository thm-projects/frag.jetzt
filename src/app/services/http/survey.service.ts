import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {SurveyStorage} from '../../models/survey/survey-storage';
import {Room} from '../../models/room';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {

  /*
  * TODO define server end point here
  * */

  constructor() {
  }

  public getStorage(room: Room): Observable<SurveyStorage> {
    return of(null);
  }

  public updateStorage(roomId: Room, storage: SurveyStorage): Observable<SurveyStorage> {
    return of(null);
  }

}
