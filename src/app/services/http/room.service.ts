import { Injectable } from '@angular/core';
import { Room } from '../../models/room';
import { UserRole } from '../../models/user-roles.enum';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { BaseHttpService } from './base-http.service';
import { EventService } from '../util/event.service';
import { NotificationService } from '../util/notification.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

const httpOptions = {
  headers: new HttpHeaders({})
};

export type RoomPatch = Partial<Omit<Room, 'id' | 'shortId' | 'createdAt' | 'updatedAt' | 'lastVisitCreator' |
  'brainstormingSession' | 'moderatorRoomReference'>>;

@Injectable()
export class RoomService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    rooms: '/room',
    user: '/user',
    import: '/import',
    findRooms: '/find'
  };

  constructor(
    private http: HttpClient,
    private eventService: EventService,
    private authService: AuthenticationService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    super();
  }

  getCreatorRooms(userId: string): Observable<Room[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + this.apiUrl.findRooms;
    return this.http.post<Room[]>(connectionUrl, {
      properties: { ownerId: userId },
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

  getParticipantRooms(userId: string): Observable<Room[]> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + this.apiUrl.findRooms;
    return this.http.post<Room[]>(connectionUrl, {
      properties: {},
      externalFilters: { inHistoryOfUserId: userId }
    }).pipe(
      tap((rooms) => {
        for (const r of rooms) {
          this.authService.setAccess(r.shortId, UserRole.PARTICIPANT);
        }
      }),
      catchError(this.handleError('getParticipantRooms', []))
    );
  }

  addRoom(room: Room, exc?: () => void): Observable<Room> {
    delete room.id;
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + '/';
    room.ownerId = this.authService.getUser().id;
    return this.http.post<Room>(connectionUrl, room, httpOptions).pipe(
      tap(returnedRoom => {
        this.authService.setAccess(returnedRoom.shortId, UserRole.PARTICIPANT);
      }),
      catchError(this.buildErrorExecutionCallback(`add Room ${room}`, exc))
    );
  }

  getRoom(id: string): Observable<Room> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/${id}`;
    return this.http.get<Room>(connectionUrl).pipe(
      tap(_ => ''),
      catchError(this.handleRoomError<Room>(`getRoom keyword=${id}`))
    );
  }

  getRoomByShortId(shortId: string): Observable<Room> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/~${shortId}`;
    return this.http.get<Room>(connectionUrl).pipe(
      tap(_ => ''),
      catchError(this.handleRoomError<Room>(`getRoom shortId=${shortId}`))
    );
  }

  getErrorHandledRoomByShortId(shortId: string, err: () => void): Observable<Room> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/~${shortId}`;
    return this.http.get<Room>(connectionUrl).pipe(
      tap(_ => ''),
      catchError(this.buildErrorExecutionCallback(`getRoom shortId=${shortId}`, err))
    );
  }

  addToHistory(roomId: string): void {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.user}/${this.authService.getUser().id}/roomHistory`;
    this.http.post(connectionUrl, { roomId }, httpOptions).subscribe();
  }

  removeFromHistory(roomId: string): Observable<any> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.user}/${this.authService.getUser().id}/roomHistory/${roomId}`;
    return this.http.delete<any>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<any>('deleteRoom'))
    );
  }

  patchRoom(id: string, data: RoomPatch): Observable<Room> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/${id}`;
    return this.http.patch<Room>(connectionUrl, data, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Room>('patchRoom')),
    );
  }

  updateRoom(updatedRoom: Room): Observable<Room> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/~${updatedRoom.shortId}`;
    return this.http.put(connectionUrl, updatedRoom, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<any>('updateRoom'))
    );
  }

  deleteRoom(roomId: string): Observable<any> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/${roomId}`;
    return this.http.delete<any>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<any>('deleteRoom'))
    );
  }

  createGuestsForImport(roomId: string, guestCount: number): Observable<string[]> {
    if (guestCount < 1) {
      return of([]);
    }
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + '/' + roomId + this.apiUrl.import + '/' + guestCount;
    return this.http.post<string[]>(connectionUrl, null, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<string[]>('createGuestsForImport'))
    );
  }

  handleRoomError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      if (error.status === 404) {
        this.translateService.get('room-list.room-not-exist').subscribe(msg => {
          this.notificationService.show(msg);
          this.router.navigateByUrl('');
        });
      }
      return throwError(() => error);
    };
  }

  private buildErrorExecutionCallback(data: string, exc: () => void) {
    return (error: any) => {
      if (exc) {
        exc();
      }
      return this.handleError<Room>(data)(error);
    };
  }

}
