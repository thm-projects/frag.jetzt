import { signal, untracked, WritableSignal } from '@angular/core';

export enum ConnectionStatus {
  Offline = -2,
  Error = -1,
  NotStarted = 0,
  Starting = 1,
  Available = 2,
  NotReachable = 3,
}

export enum ConnectionService {
  WebSocket, // WebSocket-Gateway
  WebSocketGateway, // REST-Endpoint
  Backend, // REST-Endpoint
}

type InternalConnectionInfo = {
  [Key in ConnectionService]: {
    type: Key;
    status: WritableSignal<ConnectionStatus>;
    lastErrors: WritableSignal<unknown[]>;
  };
};

const infos: InternalConnectionInfo = {
  [ConnectionService.WebSocket]: {
    type: ConnectionService.WebSocket,
    status: signal(ConnectionStatus.NotStarted),
    lastErrors: signal([]),
  },
  [ConnectionService.WebSocketGateway]: {
    type: ConnectionService.WebSocketGateway,
    status: signal(ConnectionStatus.NotStarted),
    lastErrors: signal([]),
  },
  [ConnectionService.Backend]: {
    type: ConnectionService.Backend,
    status: signal(ConnectionStatus.NotStarted),
    lastErrors: signal([]),
  },
};

export type ConnectionInfo = {
  readonly [Key in ConnectionService]: {
    readonly type: Key;
    readonly status: WritableSignal<ConnectionStatus>;
    readonly lastErrors: WritableSignal<unknown[]>;
  };
};

export const INFOS: ConnectionInfo = infos;

export const MAX_ERROR_LEN = 15;
export const reportServiceError = (
  service: ConnectionService,
  error: unknown,
) => {
  untracked(() =>
    infos[service].lastErrors.update((errors) => [
      error,
      ...errors.slice(0, MAX_ERROR_LEN - 1),
    ]),
  );
};

export const changeServiceStatus = <T extends ConnectionService>(
  service: T,
  status: ConnectionStatus,
) => infos[service].status.set(status);
