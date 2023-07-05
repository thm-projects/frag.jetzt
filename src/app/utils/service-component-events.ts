import { EventService } from '../services/util/event.service';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { MotdAPI } from '../services/http/motd.service';
import { MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

export class ServiceComponentEvent {
  constructor(public readonly name: string) {}
}

export class ServiceRequest<
  T extends ComponentResponse,
> extends ServiceComponentEvent {
  constructor(name: string, public readonly responseName: string) {
    super(name);
  }
}

export class ComponentResponse extends ServiceComponentEvent {}

export class LoginDialogRequest extends ServiceRequest<LoginDialogResponse> {
  constructor(public readonly redirectUrl: string = null) {
    super(LoginDialogRequest.name, LoginDialogResponse.name);
  }
}

export class LoginDialogResponse extends ComponentResponse {
  constructor() {
    super(LoginDialogResponse.name);
  }
}

export class MotdDialogRequest extends ServiceRequest<MotdDialogResponse> {
  constructor(public readonly motds: MotdAPI[]) {
    super(MotdDialogRequest.name, MotdDialogResponse.name);
  }
}

export class MotdDialogResponse extends ComponentResponse {
  constructor() {
    super(MotdDialogResponse.name);
  }
}

export class LivepollDialogRequest extends ServiceRequest<LivepollDialogRequest> {
  constructor(
    public readonly dialog: 'dialog' | 'create' | 'summary',
    public readonly config: MatDialogConfig<unknown>,
  ) {
    super(LivepollDialogRequest.name, MotdDialogResponse.name);
  }
}

export class LivepollDialogResponse extends ComponentResponse {
  constructor(public readonly dialogRef: MatDialogRef<unknown>) {
    super(LivepollDialogResponse.name);
  }
}

export class RescaleRequest extends ServiceRequest<RescaleResponse> {
  constructor(public readonly scale: number | 'initial') {
    super(RescaleRequest.name, RescaleResponse.name);
  }
}

export class RescaleResponse extends ComponentResponse {
  constructor() {
    super(RescaleResponse.name);
  }
}

export const callServiceEvent = <
  K extends ComponentResponse,
  T extends ServiceRequest<K>,
>(
  eventService: EventService,
  event: T,
): Observable<K> => {
  return new Observable<K>((subscriber) => {
    const finished = new Subject();
    eventService
      .on<K>(event.responseName)
      .pipe(
        takeUntil(finished),
        tap((data) => {
          finished.next(true);
          finished.complete();
          subscriber.next(data);
          subscriber.complete();
        }),
      )
      .subscribe();
    eventService.broadcast(event.name, event);
  });
};

export const sendEvent = (
  eventService: EventService,
  event: ServiceComponentEvent,
) => {
  eventService.broadcast(event.name, event);
};
