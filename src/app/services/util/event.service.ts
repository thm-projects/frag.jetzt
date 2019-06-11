import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { filter, map } from 'rxjs/operators';

interface BroadcastEvent {
  key: any;
  data?: any;
}

export class EventService {
  private _eventBus: Subject<BroadcastEvent>;

  constructor() {
    this._eventBus = new Subject<BroadcastEvent>();
  }

  broadcast(key: any, data?: any) {
    this._eventBus.next({ key, data });
  }

  on<T>(key: any): Observable<T> {
    return this._eventBus.asObservable().pipe(
      filter(event => event.key === key),
      map(event => <T>event.data)
    );
  }
}
