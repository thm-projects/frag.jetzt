import { Injectable } from '@angular/core';
import { Room } from './room';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, tap } from 'rxjs/operators';
import { ErrorHandlingService } from './error-handling.service';
import { AuthenticationService } from './authentication.service';

const httpOptions = {
  headers: new HttpHeaders({})
};

@Injectable()
export class RoomService extends ErrorHandlingService {
  private apiBaseUrl = 'https://arsnova-staging.mni.thm.de/api';
  private roomsUrl = '/room';
  private findRoomsUrl = '/find';

  constructor(private http: HttpClient,
              private authService: AuthenticationService) {
    super();
  }

  getCreatorRooms(): Observable<Room[]> {
    const url = this.apiBaseUrl + this.roomsUrl + this.findRoomsUrl;
    return this.http.post<Room[]>(url, {
      properties: { ownerId: this.authService.getUser().userId },
      externalFilters: {}
    }).pipe(
      tap(_ => ''),
      catchError(this.handleError('getRooms', []))
    );
  }

  getParticipantRooms(): Observable<Room[]> {
    const url = this.apiBaseUrl + this.roomsUrl + this.findRoomsUrl;
    return this.http.post<Room[]>(url, {
      properties: {},
      externalFilters: { inHistoryOfUserId: this.authService.getUser().userId }
    }).pipe(
      tap(_ => ''),
      catchError(this.handleError('getRooms', []))
    );
  }

  addRoom(room: Room): Observable<Room> {
    const connectionUrl = this.apiBaseUrl + this.roomsUrl + '/';
    return this.http.post<Room>(connectionUrl, {
      ownerId: this.authService.getUser().userId,
      abbreviation: room.abbreviation, name: room.name, closed: room.closed, description: room.description
    }, httpOptions);
  }

  getRoom(id: string): Observable<Room> {
    const connectionUrl = `${ this.apiBaseUrl }${ this.roomsUrl }/~${id}`;
    return this.http.get<Room>(connectionUrl).pipe(
      catchError(this.handleError<Room>(`getRoom id=${id}`))
    );
  }

  getRoomById(id: string): Observable<Room> {
    const connectionUrl = `${ this.apiBaseUrl }${ this.roomsUrl }/${id}`;
    return this.http.get<Room>(connectionUrl).pipe(
      catchError(this.handleError<Room>(`getRoom id=${id}`))
    );
  }

  updateRoom(room: Room): Observable<Room> {
    const connectionUrl = `${this.apiBaseUrl}${this.roomsUrl}/${room.id}`;
    return this.http.put(connectionUrl, {
      shortId: room.shortId, ownerId: this.authService.getUser().userId,
      abbreviation: room.abbreviation, name: room.name, closed: room.closed, description: room.description
    }, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<any>('updateRoom'))
    );
  }

  deleteRoom(room: Room): Observable<Room> {
    const connectionUrl = `${this.apiBaseUrl}${this.roomsUrl}/${room.id}`;
    return this.http.delete<Room>(connectionUrl, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Room>('deleteRoom'))
    );
  }
}
