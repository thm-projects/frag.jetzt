import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface MotdAPI {
  id: string;
  startTimestamp: Date;
  endTimestamp: Date;
  messages: { [key: string]: { language: string; message: string } };
}

@Injectable({
  providedIn: 'root',
})
export class MotdService extends BaseHttpService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<MotdAPI[]> {
    return this.http.get<MotdAPI[]>('/api/motds/all').pipe(
      tap((_) => ''),
      catchError((_) => of([])),
    );
  }

  getList(): Observable<MotdAPI[]> {
    return forkJoin([this.getMOTDs(false), this.getMOTDs(true)]).pipe(
      map(([oldNews, newNews]) => {
        const arr = oldNews.concat(newNews);
        arr.forEach((e) => {
          e.startTimestamp = new Date(e.startTimestamp);
          e.endTimestamp = new Date(e.endTimestamp);
        });
        arr.sort(
          (a, b) => b.startTimestamp.getTime() - a.startTimestamp.getTime(),
        );
        return arr;
      }),
    );
  }

  createMOTD(motd: Partial<MotdAPI>): Observable<MotdAPI> {
    return this.http.post<MotdAPI>('/api/motds/', motd).pipe(
      tap((_) => ''),
      catchError(this.handleError<MotdAPI>('createMOTD')),
    );
  }

  private getMOTDs(newMessages: boolean): Observable<MotdAPI[]> {
    return this.http
      .post<MotdAPI[]>('/api/motds/find', {
        properties: {},
        externalFilters: {
          [newMessages ? 'activeAt' : 'before']: new Date().getTime(),
        },
      })
      .pipe(
        tap((_) => ''),
        catchError((_) => of([])),
      );
  }
}
