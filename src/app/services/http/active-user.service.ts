import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Room } from '../../models/room';
import { catchError, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class ActiveUserService extends BaseHttpService {

  constructor(private http: HttpClient) {
    super();
  }

  public getActiveUser(room: Room): Observable<any> {
    const url = '/api/roomsubscription/usercount?ids=' + room.id;
    return this.http.get(url, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('yeet'))
    );
  }

}
