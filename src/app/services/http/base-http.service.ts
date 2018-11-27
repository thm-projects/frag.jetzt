import { Injectable } from '@angular/core';
import { of ,  Observable } from 'rxjs';

@Injectable()
export class BaseHttpService {

  constructor() {
  }

  public handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }
}
