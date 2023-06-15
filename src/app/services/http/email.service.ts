import { Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { Observable, catchError, tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
  providedIn: 'root',
})
export class EmailService extends BaseHttpService {
  constructor(private httpClient: HttpClient) {
    super();
  }

  sendEmailToAll(subject: string, message: string): Observable<void> {
    return this.httpClient
      .post<void>(
        '/api/admin-email/send',
        {
          properties: { subject, message },
          externalFilters: {},
        },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        catchError(this.handleError<void>('sendEmailToAll')),
      );
  }
}
