import { Injectable } from '@angular/core';
import { Room } from '../../models/room';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { BaseHttpService } from './base-http.service';
import { TSMap } from 'typescript-map';

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

  constructor(private http: HttpClient,
              private authService: AuthenticationService) {
    super();
  }

  getCreatorRooms(): Observable<Room[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + this.apiUrl.findRooms;
    return this.http.post<Room[]>(connectionUrl, {
      properties: { ownerId: this.authService.getUser().id },
      externalFilters: {}
    }).pipe(
      tap(() => ''),
      catchError(this.handleError('getCreatorRooms', []))
    );
  }

  getParticipantRooms(): Observable<Room[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + this.apiUrl.findRooms;
    return this.http.post<Room[]>(connectionUrl, {
      properties: {},
      externalFilters: { inHistoryOfUserId: this.authService.getUser().id }
    }).pipe(
      tap(() => ''),
      catchError(this.handleError('getParticipantRooms', []))
    );
  }

  addRoom(room: Room): Observable<Room> {
    delete room.id;
    delete room.revision;
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + '/';
    room.ownerId = this.authService.getUser().id;
    return this.http.post<Room>(connectionUrl, room, httpOptions);
  }

  getRoom(id: string): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base +  this.apiUrl.rooms }/${ id }`;
    return this.http.get<Room>(connectionUrl).pipe(
      map(room => this.parseExtensions(room)),
      map(room => this.parseDefaultContentGroup(room)),
      tap(room => this.setRoomId(room)),
      catchError(this.handleError<Room>(`getRoom keyword=${ id }`))
    );
  }

  getRoomByShortId(shortId: string): Observable<Room> {
    const connectionUrl = `${ this.apiUrl.base +  this.apiUrl.rooms }/~${ shortId }`;
    return this.http.get<Room>(connectionUrl).pipe(
      map(room => this.parseDefaultContentGroup(room)),
      tap(room => this.setRoomId(room)),
      catchError(this.handleError<Room>(`getRoom shortId=${ shortId }`))
    );
  }

  addToHistory(roomId: string): void {
    const connectionUrl = `${ this.apiUrl.base + this.apiUrl.user }/${ this.authService.getUser().id }/roomHistory`;
    this.http.post(connectionUrl, { roomId: roomId, lastVisit: this.joinDate.getTime() }, httpOptions).subscribe();
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

  parseDefaultContentGroup(room: Room): Room {
    if (room.contentGroups) {
      for (const cg of room.contentGroups) {
        if (!cg.name || cg.name === '') {
          cg.name = 'Default';
        }
      }
    }
    return room;
  }

  parseExtensions(room: Room): Room {
    if (room.extensions) {
      let extensions: TSMap<string, TSMap<string, any>> = new TSMap();
      extensions = room.extensions;
      room.extensions = extensions;
    }
    return room;
  }

  setRoomId(room: Room): void {
    localStorage.setItem('roomId', room.id);
  }
}
