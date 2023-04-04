import { EventService } from 'app/services/util/event.service';
import { Observable, Subject, take, takeUntil, tap } from 'rxjs';

export class ComponentEvent<T> {
  constructor(
    public readonly listenEvent: string,
    public readonly pushEvent: string,
    public readonly data?: T,
  ) {}
}

export const sendAwaitingEvent = <T>(
  eventService: EventService,
  event: ComponentEvent<T>,
) => {
  return eventService.on(event.listenEvent).pipe(
    take(1),
    tap(() => eventService.broadcast(event.pushEvent, event.data)),
  );
};

export const sendSyncEvent = <T>(
  eventService: EventService,
  event: ComponentEvent<T>,
) => {
  return new Observable((subscriber) => {
    const finished = new Subject();
    eventService
      .on(event.listenEvent)
      .pipe(takeUntil(finished))
      .subscribe({
        next: (data) => {
          finished.next(true);
          finished.complete();
          subscriber.next(data);
        },
        error: (err) => {
          finished.next(true);
          finished.complete();
          subscriber.next(err);
        },
      });
    eventService.broadcast(event.pushEvent, event.data);
    finished.next(true);
    finished.complete();
  });
};
