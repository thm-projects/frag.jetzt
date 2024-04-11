import { EventService } from '../services/util/event.service';
import { Observable, filter, first } from 'rxjs';
import { MotdAPI } from '../services/http/motd.service';
import { ClassType, UUID } from './ts-utils';
import { MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

let counter = 0;

export class ServiceComponentEvent {
  constructor(public readonly name: string, public readonly id: number) {}
}

export class ServiceRequest<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Type extends ServiceRequest<Type, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Response extends ComponentResponse<any, Type>,
> extends ServiceComponentEvent {
  constructor(
    clazz: ClassType<Type>,
    public readonly responseClass: ClassType<Response>,
  ) {
    super(clazz.name, counter++);
  }
}

export class ComponentResponse<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Type extends ComponentResponse<Type, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Request extends ServiceRequest<any, Type>,
> extends ServiceComponentEvent {
  constructor(clazz: ClassType<Type>, request: Request) {
    super(clazz.name, request.id);
  }
}

export class LoginDialogRequest extends ServiceRequest<
  LoginDialogRequest,
  LoginDialogResponse
> {
  constructor(public readonly redirectUrl: string = null) {
    super(LoginDialogRequest, LoginDialogResponse);
  }
}

export class LoginDialogResponse extends ComponentResponse<
  LoginDialogResponse,
  LoginDialogRequest
> {
  constructor(
    request: LoginDialogRequest,
    public readonly keycloakId: UUID | null,
  ) {
    super(LoginDialogResponse, request);
  }
}

export class CookieDialogRequest extends ServiceRequest<
  CookieDialogRequest,
  CookieDialogResponse
> {
  constructor() {
    super(CookieDialogRequest, CookieDialogResponse);
  }
}

export class CookieDialogResponse extends ComponentResponse<
  CookieDialogResponse,
  CookieDialogRequest
> {
  constructor(request: CookieDialogRequest, public readonly accepted: boolean) {
    super(CookieDialogResponse, request);
  }
}

export class MotdDialogRequest extends ServiceRequest<
  MotdDialogRequest,
  MotdDialogResponse
> {
  constructor(public readonly motds: MotdAPI[]) {
    super(MotdDialogRequest, MotdDialogResponse);
  }
}

export class MotdDialogResponse extends ComponentResponse<
  MotdDialogResponse,
  MotdDialogRequest
> {
  constructor(request: MotdDialogRequest) {
    super(MotdDialogResponse, request);
  }
}

export class LivepollDialogRequest extends ServiceRequest<
  LivepollDialogRequest,
  LivepollDialogResponse
> {
  constructor(
    public readonly dialog: 'dialog' | 'create' | 'summary' | 'comparison',
    public readonly config: MatDialogConfig<unknown>,
  ) {
    super(LivepollDialogRequest, LivepollDialogResponse);
  }
}

export class LivepollDialogResponse extends ComponentResponse<
  LivepollDialogResponse,
  LivepollDialogRequest
> {
  constructor(
    request: LivepollDialogRequest,
    public readonly dialogRef: MatDialogRef<unknown>,
  ) {
    super(LivepollDialogResponse, request);
  }
}

export class RescaleRequest extends ServiceRequest<
  RescaleRequest,
  RescaleResponse
> {
  constructor(public readonly scale: number | 'initial') {
    super(RescaleRequest, RescaleResponse);
  }
}

export class RescaleResponse extends ComponentResponse<
  RescaleResponse,
  RescaleRequest
> {
  constructor(request: RescaleRequest) {
    super(RescaleResponse, request);
  }
}

export class OnboardingRequest extends ServiceRequest<
  OnboardingRequest,
  OnboardingResponse
> {
  constructor() {
    super(OnboardingRequest, OnboardingResponse);
  }
}

export class OnboardingResponse extends ComponentResponse<
  OnboardingResponse,
  OnboardingRequest
> {
  constructor(request: OnboardingRequest) {
    super(OnboardingResponse, request);
  }
}

export class SafariUnsupportedRequest extends ServiceRequest<
  SafariUnsupportedRequest,
  SafariUnsupportedResponse
> {
  constructor() {
    super(SafariUnsupportedRequest, SafariUnsupportedResponse);
  }
}

export class SafariUnsupportedResponse extends ComponentResponse<
  SafariUnsupportedResponse,
  SafariUnsupportedRequest
> {
  constructor(request: SafariUnsupportedRequest) {
    super(SafariUnsupportedResponse, request);
  }
}

export const callServiceEvent = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends ServiceRequest<T, any>,
  K extends InstanceType<T['responseClass']>,
>(
  eventService: EventService,
  event: T,
): Observable<K> => {
  return new Observable<K>((subscriber) => {
    eventService
      .on<K>(event.responseClass.name)
      .pipe(
        first(
          (v) =>
            (v as object) instanceof event.responseClass && v?.id === event.id,
        ),
      )
      .subscribe((v) => {
        subscriber.next(v);
        subscriber.complete();
      });
    eventService.broadcast(event.name, event);
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const listenEvent = <T extends ServiceRequest<T, any>>(
  eventService: EventService,
  clazz: ClassType<T>,
) => eventService.on<T>(clazz.name).pipe(filter((v) => v instanceof clazz));

export const sendEvent = (
  eventService: EventService,
  event: ServiceComponentEvent,
) => {
  eventService.broadcast(event.name, event);
};
