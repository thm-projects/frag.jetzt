import { Injectable } from '@angular/core';
import { RatingResult } from 'app/models/rating-result';
import {
  Observable,
  Subject,
  catchError,
  concatMap,
  distinctUntilChanged,
  filter,
  interval,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
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
      switchMap(() => interval(60_000).pipe(startWith(0))),
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
    let offlineEmitted = false;
    const subjectOnline = new Subject();
    return this.online$.pipe(
      takeUntil(subjectOnline),
      concatMap((online) => {
        if (!online) {
          if (offlineEmitted) {
            return of();
          }
          offlineEmitted = true;
          return offlineAction;
        }
        subjectOnline.next(true);
        subjectOnline.complete();
        return onlineAction;
      }),
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
    let offlineEmitted = false;
    const subjectOnline = new Subject();
    return this.backendStatus$.pipe(
      takeUntil(subjectOnline),
      concatMap((online) => {
        if (online !== BackendStatus.Available) {
          if (offlineEmitted) {
            return of();
          }
          offlineEmitted = true;
          return offlineAction;
        }
        subjectOnline.next(true);
        subjectOnline.complete();
        return onlineAction;
      }),
    );
  }
}
