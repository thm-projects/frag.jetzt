import { Injectable } from '@angular/core';
import { RatingResult } from 'app/models/rating-result';
import {
  Observable,
  catchError,
  concat,
  distinctUntilChanged,
  filter,
  interval,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { RatingService } from '../http/rating.service';

export enum BackendStatus {
  Available = 'Available',
  NoNetwork = 'NoNetwork',
  NotReachable = 'NotReachable',
}

@Injectable({
  providedIn: 'root',
})
export class OnlineStateService {
  readonly online$: Observable<boolean>;
  readonly ratingStats$: Observable<RatingResult>;
  readonly backendStatus$: Observable<BackendStatus>;

  constructor(rating: RatingService) {
    this.online$ = new Observable<boolean>((subscriber) => {
      const listener1 = () => subscriber.next(true);
      const listener2 = () => subscriber.next(false);
      window.addEventListener('online', listener1);
      window.addEventListener('offline', listener2);
      subscriber.next(window.navigator.onLine);
      return () => {
        window.removeEventListener('online', listener1);
        window.removeEventListener('offline', listener2);
      };
    }).pipe(distinctUntilChanged(), shareReplay(1));
    this.ratingStats$ = this.online$.pipe(
      filter((v) => Boolean(v)),
      switchMap(() => interval(5000).pipe(startWith(0))),
      switchMap(() =>
        rating.getRatings().pipe(
          catchError((err) => {
            console.log(err);
            return of(null);
          }),
        ),
      ),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
    this.backendStatus$ = merge(
      this.online$.pipe(
        filter((v) => !v),
        map(() => BackendStatus.NoNetwork),
      ),
      this.ratingStats$.pipe(
        map(() => BackendStatus.Available),
        catchError((err) => {
          console.log('TODO', err);
          return of(BackendStatus.NotReachable);
        }),
      ),
    ).pipe(distinctUntilChanged(), shareReplay(1));
  }

  isOnline() {
    let isOnline = null;
    this.online$
      .subscribe((online) => {
        isOnline = online;
      })
      .unsubscribe();
    return isOnline;
  }

  refreshWhenOnline<T>(
    offlineAction: Observable<T>,
    onlineAction: Observable<T>,
  ): Observable<T> {
    if (this.isOnline()) {
      return onlineAction;
    }
    const emitter = this.online$.pipe(
      filter((v) => Boolean(v)),
      take(1),
    );
    return concat(
      offlineAction.pipe(takeUntil(emitter)),
      emitter.pipe(switchMap(() => onlineAction)),
    );
  }

  isReachable() {
    let isReachable = null;
    this.backendStatus$
      .subscribe((status) => (isReachable = status === BackendStatus.Available))
      .unsubscribe();
    return isReachable;
  }

  refreshWhenReachable<T>(
    offlineAction: Observable<T>,
    onlineAction: Observable<T>,
  ): Observable<T> {
    if (this.isReachable()) {
      return onlineAction;
    }
    const emitter = this.backendStatus$.pipe(
      filter((v) => v === BackendStatus.Available),
      take(1),
    );
    return concat(
      offlineAction.pipe(takeUntil(emitter)),
      emitter.pipe(switchMap(() => onlineAction)),
    );
  }
}
