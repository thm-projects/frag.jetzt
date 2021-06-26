import { Injectable } from '@angular/core';
import { ProfanityFilterType, Room } from '../../models/room';
import { UserRole } from '../../models/user-roles.enum';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { BaseHttpService } from './base-http.service';
import { EventService } from '../util/event.service';

const httpOptions = {
  headers: new HttpHeaders({})
};

@Injectable()
export class RoomService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    rooms: '/room',
    user: '/user',
    findRooms: '/find'
  };
  private joinDate = new Date(Date.now());

  constructor(
    private http: HttpClient,
    private eventService: EventService,
    private authService: AuthenticationService
  ) {
    super();
  }

  getCreatorRooms(): Observable<Room[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + this.apiUrl.findRooms;
    return this.http.post<Room[]>(connectionUrl, {
      properties: { ownerId: this.authService.getUser().id },
      externalFilters: {}
    }).pipe(
      tap((rooms) => {
        for (const r of rooms) {
          this.authService.setAccess(r.shortId, UserRole.CREATOR);
        }
      }),
      catchError(this.handleError('getCreatorRooms', []))
    );
  }

  getParticipantRooms(): Observable<Room[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + this.apiUrl.findRooms;
    return this.http.post<Room[]>(connectionUrl, {
      properties: {},
      externalFilters: { inHistoryOfUserId: this.authService.getUser().id }
    }).pipe(
      tap((rooms) => {
        for (const r of rooms) {
          this.authService.setAccess(r.shortId, UserRole.PARTICIPANT);
        }
      }),
      catchError(this.handleError('getParticipantRooms', []))
    );
  }

  addRoom(room: Room, exc?: () => void ): Observable<Room> {
    delete room.id;
    delete room.revision;
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + '/';
    room.ownerId = this.authService.getUser().id;
    return this.http.post<Room>(connectionUrl, room, httpOptions).pipe(
      tap(returnedRoom => {
        this.authService.setAccess(returnedRoom.shortId, UserRole.PARTICIPANT);
      }),
      catchError(err => {
        if (exc) {
          exc();
        }
        return this.handleError<Room>(`add Room ${room}`);
      })
    );
  }

  getRoom(id: string): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base +  this.apiUrl.rooms }/${ id }`;
    return this.http.get<Room>(connectionUrl).pipe(
      tap(room => this.setRoomId(room)),
      catchError(this.handleError<Room>(`getRoom keyword=${ id }`))
    );
  }

  getRoomByShortId(shortId: string): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base +  this.apiUrl.rooms }/~${ shortId }`;
    return this.http.get<Room>(connectionUrl).pipe(
      tap(room => this.setRoomId(room)),
      catchError(this.handleError<Room>(`getRoom shortId=${ shortId }`))
    );
  }

  getErrorHandledRoomByShortId(shortId: string, err: () => void ): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base +  this.apiUrl.rooms }/~${ shortId }`;
    return this.http.get<Room>(connectionUrl).pipe(
      tap(room => this.setRoomId(room)),
      catchError(() => {
        err();
        return this.handleError<Room>(`getRoom shortId=${ shortId }`);
      })
    );
  }

  addToHistory(roomId: string): void {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.user }/${ this.authService.getUser().id }/roomHistory`;
    this.http.post(connectionUrl, { roomId, lastVisit: this.joinDate.getTime() }, httpOptions).subscribe();
  }

  removeFromHistory(roomId: string): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.user }/${ this.authService.getUser().id }/roomHistory/${roomId}`;
    return this.http.delete<Room>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Room>('deleteRoom'))
    );
  }

  updateRoom(updatedRoom: Room): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.rooms }/~${ updatedRoom.shortId }`;
    return this.http.put(connectionUrl, updatedRoom , httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<any>('updateRoom'))
    );
  }

  deleteRoom(roomId: string): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.rooms }/${ roomId }`;
    return this.http.delete<Room>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Room>('deleteRoom'))
    );
  }

  setRoomId(room: Room): void {
    // temp solution until the backend is updated
    const filter = localStorage.getItem('room-profanity-filter');
    room.profanityFilter =  filter as ProfanityFilterType;
    localStorage.setItem('roomId', room.id);
  }
}
