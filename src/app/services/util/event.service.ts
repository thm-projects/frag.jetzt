import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';

interface BroadcastEvent {
  key: string;
  data?: unknown;
}

@Injectable()
export class EventService {
  static instance: EventService;
  focusOnInput = false;
  private _eventBus = new Subject<BroadcastEvent>();

  constructor() {
    EventService.instance = this;
  }

  broadcast(key: string, data?: unknown) {
    console.log('broadcasting', key, data);
    this._eventBus.next({ key, data });
  }

  makeFocusOnInputTrue() {
    this.focusOnInput = true;
  }

  makeFocusOnInputFalse() {
    this.focusOnInput = false;
  }

  on<T>(key: string): Observable<T> {
    return this._eventBus.pipe(
      filter((event) => event.key === key),
      map((event) => event.data as T),
    );
  }
}
