import { Injectable } from '@angular/core';
import { Room } from '../../models/room';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, tap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { BaseHttpService } from './base-http.service';

const httpOptions = {
  headers: new HttpHeaders({})
};

@Injectable()
export class RoomService extends BaseHttpService {
  private apiUrl = {
    base: 'https://arsnova-staging.mni.thm.de/api',
    rooms: '/room',
    user: '/user',
    findRooms: '/find'
  };
  private joinDate = new Date(Date.now());

  constructor(private http: HttpClient,
              private authService: AuthenticationService) {
    super();
  }

  getCreatorRooms(): Observable<Room[]> {
    const url = this.apiUrl.base + this.apiUrl.rooms + this.apiUrl.findRooms;
    return this.http.post<Room[]>(url, {
      properties: { ownerId: this.authService.getUser().id },
      externalFilters: {}
    }).pipe(
      tap(() => ''),
      catchError(this.handleError('getRooms', []))
    );
  }

  getParticipantRooms(): Observable<Room[]> {
    const url = this.apiUrl.base + this.apiUrl.rooms + this.apiUrl.findRooms;
    return this.http.post<Room[]>(url, {
      properties: {},
      externalFilters: { inHistoryOfUserId: this.authService.getUser().id }
    }).pipe(
      tap(() => ''),
      catchError(this.handleError('getRooms', []))
    );
  }

  addRoom(room: Room): Observable<Room> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + '/';
    return this.http.post<Room>(connectionUrl, {
      ownerId: this.authService.getUser().id,
      abbreviation: room.abbreviation, name: room.name, closed: room.closed, description: room.description
    }, httpOptions);
  }

  getRoom(id: string): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.rooms }/~${ id }`;
    return this.http.get<Room>(connectionUrl).pipe(
      catchError(this.handleError<Room>(`getRoom id=${ id }`))
    );
  }

  addToHistory(roomId: string): void {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.user }/${ this.authService.getUser().id }/roomHistory`;
    this.http.post(connectionUrl, { roomId: roomId, lastVisit: this.joinDate.getTime() }, httpOptions).subscribe(r => console.log(r));
  }

  getRoomById(id: string): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.rooms }/${ id }`;
    return this.http.get<Room>(connectionUrl).pipe(
      catchError(this.handleError<Room>(`getRoom id=${ id }`))
    );
  }

  updateRoom(updatedRoom: Room): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.rooms }/~${ updatedRoom.shortId }`;
    return this.http.put(connectionUrl, updatedRoom , httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<any>('updateRoom'))
    );
  }

  deleteRoom(room: Room): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.rooms }/${ room.id }`;
    return this.http.delete<Room>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Room>('deleteRoom'))
    );
  }
}
