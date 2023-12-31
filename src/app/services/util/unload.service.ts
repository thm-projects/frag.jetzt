import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UnloadService {
  onUnload(): Observable<BeforeUnloadEvent> {
    return new Observable<BeforeUnloadEvent>((subscriber) => {
      const evt = (e: BeforeUnloadEvent) => subscriber.next(e);
      window.addEventListener('beforeunload', evt);
      return () => {
        subscriber.complete();
        window.removeEventListener('beforeunload', evt);
      };
    });
  }
}
