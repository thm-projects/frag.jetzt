import { Injectable } from '@angular/core';
import { of ,  Observable, throwError } from 'rxjs';

@Injectable()
export class BaseHttpService {

  constructor() {
  }

  public handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return throwError(error);
    };
  }
}
