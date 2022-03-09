import { Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';

interface BroadcastEvent {
  key: any;
  data?: any;
}

@Injectable()
export class EventService {
  private _eventBus: Subject<BroadcastEvent>;
  focusOnInput: boolean;

  constructor() {
    this._eventBus = new Subject<BroadcastEvent>();
    this.focusOnInput = false;
  }

  broadcast(key: any, data?: any) {
    this._eventBus.next({ key, data });
  }

  makeFocusOnInputTrue() {
    this.focusOnInput = true;
  }

  makeFocusOnInputFalse() {
    this.focusOnInput = false;
  }

  on<T>(key: any): Observable<T> {
    return this._eventBus.asObservable().pipe(
      filter(event => event.key === key),
      map(event => <T>event.data)
    );
  }
}
