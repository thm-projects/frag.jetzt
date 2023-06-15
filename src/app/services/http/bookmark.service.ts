import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Bookmark } from '../../models/bookmark';

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class BookmarkService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    bookmark: '/bookmark',
    find: '/find',
  };

  constructor(private http: HttpClient) {
    super();
  }

  create(bookmark: Partial<Bookmark>): Observable<Bookmark> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.bookmark + '/';
    return this.http.post<Bookmark>(connectionUrl, bookmark, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Bookmark>('create')),
    );
  }

  delete(bookmarkId: string): Observable<void> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.bookmark + '/' + bookmarkId;
    return this.http.delete<void>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('delete')),
    );
  }

  getByRoomId(roomId: string): Observable<Bookmark[]> {
    const connectionUrl =
      this.apiUrl.base + this.apiUrl.bookmark + this.apiUrl.find;
    return this.http
      .post<Bookmark[]>(
        connectionUrl,
        {
          properties: { roomId },
          externalFilters: {},
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        catchError(this.handleError<Bookmark[]>('getByRoomId')),
      );
  }
}
