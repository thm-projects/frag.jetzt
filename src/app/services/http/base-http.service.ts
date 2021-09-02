import { Injectable } from '@angular/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class BaseHttpService {

  private nextRequest = 0;

  constructor() {
  }

  public handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      if (error instanceof TimeoutError) {
        this.nextRequest = new Date().getTime() + 1_000;
      } else if (error instanceof HttpErrorResponse) {
        if (error.status === 429 || error.status === 456) {
          this.nextRequest = new Date().getTime() + 30_000;
        }
      }
      console.error(error);
      return throwError(error);
    };
  }

  protected checkCanSendRequest(operation = 'operation'): Observable<any> {
    if (new Date().getTime() < this.nextRequest) {
      console.error(operation + ' is in timeout');
      return throwError(new TimeoutError());
    }
    return null;
  }
}
