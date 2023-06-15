import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';

interface BroadcastEvent<T> {
  key: string;
  data?: T;
}

@Injectable()
export class EventService {
  focusOnInput: boolean;
  private _eventBus: Subject<BroadcastEvent<unknown>>;

  constructor() {
    this._eventBus = new Subject<BroadcastEvent<unknown>>();
    this.focusOnInput = false;
  }

  broadcast<T>(key: string, data?: T) {
    this._eventBus.next({ key, data });
  }

  makeFocusOnInputTrue() {
    this.focusOnInput = true;
  }

  makeFocusOnInputFalse() {
    this.focusOnInput = false;
  }

  on<T>(key: string): Observable<T> {
    return this._eventBus.asObservable().pipe(
      filter((event) => event.key === key),
      map((event) => event.data as T),
    );
  }
}
