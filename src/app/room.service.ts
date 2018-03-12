import { Injectable } from '@angular/core';
import { Room } from './room';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { catchError, tap } from 'rxjs/operators';
import { ErrorHandlingService } from './error-handling.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class RoomService extends ErrorHandlingService {
  private roomsUrl = 'api/rooms';

  constructor(private http: HttpClient) {
    super();
  }

  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(this.roomsUrl).pipe(
      tap(_ => ''),
      catchError(this.handleError('getRooms', []))
    );
  }

  addRoom(room: Room): Observable<Room> {
    return this.http.post<Room>(this.roomsUrl, room, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Room>('addRoom'))
    );
  }

  getRoom(id: string): Observable<Room> {
    const url = `${this.roomsUrl}/${id}`;
    return this.http.get<Room>(url).pipe(
    catchError(this.handleError<Room>(`getRoom id=${id}`))
  );
  }

  deleteRoom (room: Room | string): Observable<Room> {
    const id = typeof room === 'string' ? room : room.id;
    const url = `${this.roomsUrl}/${id}`;

    return this.http.delete<Room>(url, httpOptions).pipe(
      tap(_ => ''),
      catchError(this.handleError<Room>('deleteRoom'))
    );
  }
}
