import { Injectable } from '@angular/core';
import { Room } from '../../models/room';
import { UserRole } from '../../models/user-roles.enum';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { BaseHttpService } from './base-http.service';
import { EventService } from '../util/event.service';
import { NotificationService } from '../util/notification.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { QuillUtils, SerializedDelta } from '../../utils/quill-utils';
import { UserManagementService } from '../util/user-management.service';
import { BrainstormingSession } from 'app/models/brainstorming-session';
import { UUID } from 'app/utils/ts-utils';

const httpOptions = {
  headers: new HttpHeaders({}),
};

export type RoomAPI = Omit<Room, 'description'> & {
  description: SerializedDelta;
};

export type RoomPatch = Partial<
  Omit<
    RoomAPI,
    | 'id'
    | 'shortId'
    | 'createdAt'
    | 'updatedAt'
    | 'lastVisitCreator'
    | 'brainstormingSession'
    | 'moderatorRoomReference'
  >
>;

@Injectable()
export class RoomService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    rooms: '/room',
    user: '/user',
    import: '/import',
    findRooms: '/find',
  };

  constructor(
    private http: HttpClient,
    private eventService: EventService,
    private userManagementService: UserManagementService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private router: Router,
  ) {
    super();
  }

  getCreatorRooms(userId: string): Observable<Room[]> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.rooms + this.apiUrl.findRooms;
    return this.http
      .post<RoomAPI[]>(connectionUrl, {
        properties: { ownerId: userId },
        externalFilters: {},
      })
      .pipe(
        map((rooms) => rooms.map((r) => this.parseRoom(r))),
        tap((rooms) => {
          for (const r of rooms) {
            this.userManagementService.setAccess(
              r.shortId,
              r.id,
              UserRole.CREATOR,
            );
          }
        }),
        catchError(this.handleError('getCreatorRooms', [])),
      );
  }

  getParticipantRooms(userId: string): Observable<Room[]> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.rooms + this.apiUrl.findRooms;
    return this.http
      .post<RoomAPI[]>(connectionUrl, {
        properties: {},
        externalFilters: { inHistoryOfUserId: userId },
      })
      .pipe(
        map((rooms) => rooms.map((r) => this.parseRoom(r))),
        tap((rooms) => {
          for (const r of rooms) {
            this.userManagementService.setAccess(
              r.shortId,
              r.id,
              UserRole.PARTICIPANT,
            );
          }
        }),
        catchError(this.handleError('getParticipantRooms', [])),
      );
  }

  addRoom(room: Room, exc?: () => void): Observable<Room> {
    delete room.id;
    const connectionUrl = this.apiUrl.base + this.apiUrl.rooms + '/';
    room.ownerId = this.userManagementService.getCurrentUser().id;
    return this.http
      .post<RoomAPI>(
        connectionUrl,
        {
          ...room,
          description: QuillUtils.serializeDelta(room.description),
        },
        httpOptions,
      )
      .pipe(
        map((r) => this.parseRoom(r)),
        tap((returnedRoom) => {
          this.userManagementService.setAccess(
            returnedRoom.shortId,
            returnedRoom.id,
            UserRole.PARTICIPANT,
          );
        }),
        catchError(this.buildErrorExecutionCallback(`add Room ${room}`, exc)),
      );
  }

  getRoom(id: string): Observable<Room> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/${id}`;
    return this.http.get<RoomAPI>(connectionUrl).pipe(
      map((r) => this.parseRoom(r)),
      tap((_) => ''),
      catchError(this.handleRoomError<Room>(`getRoom keyword=${id}`)),
    );
  }

  getRoomByShortId(shortId: string): Observable<Room> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/~${shortId}`;
    return this.http.get<RoomAPI>(connectionUrl).pipe(
      map((r) => this.parseRoom(r)),
      tap((_) => ''),
      catchError(this.handleRoomError<Room>(`getRoom shortId=${shortId}`)),
    );
  }

  getErrorHandledRoomByShortId(
    shortId: string,
    err: () => void,
  ): Observable<Room> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/~${shortId}`;
    return this.http.get<RoomAPI>(connectionUrl).pipe(
      map((r) => this.parseRoom(r)),
      tap((_) => ''),
      catchError(
        this.buildErrorExecutionCallback(`getRoom shortId=${shortId}`, err),
      ),
    );
  }

  addToHistory(roomId: string): void {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.user}/${
      this.userManagementService.getCurrentUser().id
    }/roomHistory`;
    this.http.post(connectionUrl, { roomId }, httpOptions).subscribe();
  }

  removeFromHistory(roomId: string): Observable<void> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.user}/${
      this.userManagementService.getCurrentUser().id
    }/roomHistory/${roomId}`;
    return this.http.delete<void>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteRoom')),
    );
  }

  patchRoom(id: string, data: RoomPatch): Observable<Room> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/${id}`;
    return this.http.patch<RoomAPI>(connectionUrl, data, httpOptions).pipe(
      map((r) => this.parseRoom(r)),
      tap(() => ''),
      catchError(this.handleError<Room>('patchRoom')),
    );
  }

  updateRoom(updatedRoom: Room): Observable<Room> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/~${
      updatedRoom.shortId
    }`;
    return this.http
      .put<RoomAPI>(
        connectionUrl,
        {
          ...updatedRoom,
          description: QuillUtils.serializeDelta(updatedRoom.description),
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        catchError(this.handleError<any>('updateRoom')),
      );
  }

  deleteRoom(roomId: string): Observable<void> {
    const connectionUrl = `${this.apiUrl.base + this.apiUrl.rooms}/${roomId}`;
    return this.http.delete<void>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteRoom')),
    );
  }

  createGuestsForImport(
    roomId: UUID,
    guestCount: number,
  ): Observable<string[]> {
    if (guestCount < 1) {
      return of([]);
    }
    const connectionUrl =
      this.apiUrl.base +
      this.apiUrl.rooms +
      '/' +
      roomId +
      this.apiUrl.import +
      '/' +
      guestCount;
    return this.http.post<string[]>(connectionUrl, null, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<string[]>('createGuestsForImport')),
    );
  }

  handleRoomError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      if (error.status === 404) {
        this.translateService
          .get('room-list.room-not-exist')
          .subscribe((msg) => {
            this.notificationService.show(msg);
            this.router.navigateByUrl('');
          });
      }
      return throwError(() => error);
    };
  }

  private parseRoom(room: RoomAPI): Room {
    const newRoom = room as unknown as Room;
    newRoom.description = QuillUtils.deserializeDelta(room.description, true);
    if (newRoom.brainstormingSession?.ideasEndTimestamp) {
      newRoom.brainstormingSession.ideasEndTimestamp = new Date(
        newRoom.brainstormingSession.ideasEndTimestamp,
      );
    }
    newRoom.brainstormingSession = newRoom.brainstormingSession
      ? new BrainstormingSession(newRoom.brainstormingSession)
      : newRoom.brainstormingSession;
    return newRoom;
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
