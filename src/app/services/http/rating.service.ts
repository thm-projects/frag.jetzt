import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { Observable } from 'rxjs';
import { Rating } from '../../models/rating';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { RatingResult } from '../../models/rating-result';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class RatingService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    rating: '/rating',
    accumulated: '/accumulated',
  };

  constructor(private http: HttpClient) {
    super();
  }

  public getByAccountId(accountId: string): Observable<Rating> {
    const connectionUrl = `${this.apiUrl.base}${this.apiUrl.rating}/${accountId}`;
    return this.http.get<Rating>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<Rating>('getByUserId')),
    );
  }

  public create(accountId: string, rating: number): Observable<Rating> {
    const connectionUrl = `${this.apiUrl.base}${this.apiUrl.rating}/`;
    return this.http
      .post<Rating>(connectionUrl, { accountId, rating }, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<Rating>('create')),
      );
  }

  public deleteByAccountId(accountId: string): Observable<void> {
    const connectionUrl = `${this.apiUrl.base}${this.apiUrl.rating}/${accountId}`;
    return this.http.delete<void>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<void>('deleteByUserId')),
    );
  }

  public getRatings(): Observable<RatingResult> {
    const connectionUrl = `${this.apiUrl.base}${this.apiUrl.rating}${this.apiUrl.accumulated}`;
    return this.http.get<RatingResult>(connectionUrl, httpOptions).pipe(
      tap(() => ''),
      catchError(this.handleError<RatingResult>('getRatings')),
    );
  }
}
