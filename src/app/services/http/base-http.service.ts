import { Injectable } from '@angular/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class BaseHttpService {
  private nextRequest = 0;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public handleError<T>(operation = 'operation', result?: T) {
    return (error: object): Observable<T> => {
      if (error instanceof TimeoutError) {
        this.nextRequest = new Date().getTime() + 1_000;
      } else if (error instanceof HttpErrorResponse) {
        if (error.status === 429) {
          this.nextRequest = new Date().getTime() + 30_000;
        } else if (error.status === 456) {
          this.nextRequest = new Date().getTime() + 86_400_000;
        }
      }
      console.error(operation, error);
      return throwError(() => error);
    };
  }

  protected setTimeout(ms: number): void {
    this.nextRequest = new Date().getTime() + ms;
  }

  protected checkCanSendRequest<T>(operation = 'operation'): Observable<T> {
    if (new Date().getTime() < this.nextRequest) {
      const message = `${operation} is in timeout`;
      console.error(message);
      return throwError(() => new Error(message));
    }
    return null;
  }
}
