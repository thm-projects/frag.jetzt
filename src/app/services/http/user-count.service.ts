import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { Room } from '../../models/room';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../util/event.service';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserCountService extends BaseHttpService {
  constructor(
    private http: HttpClient,
    private eventService: EventService,
    private authService: AuthenticationService
  ) {
    super();
  }

  public getUserCount(room: Room): Observable<any> {
    const connectionUrl = '/api/roomsubscription/usercount?ids=' + room.id;
    return this.http.get<any>(connectionUrl).pipe(
      tap(r => console.log(r)),
      catchError(this.handleError<any>(''))
    );
  }

}
