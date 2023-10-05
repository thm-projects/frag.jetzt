import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InitService {
  readonly init$: Observable<void>;
  private initFired = false;

  constructor() {
    this.init$ = new ReplaySubject(1);
  }

  init() {
    if (this.initFired) {
      return;
    }
    this.initFired = true;
    (this.init$ as ReplaySubject<void>).next(undefined);
  }
}
