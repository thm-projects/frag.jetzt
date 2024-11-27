import { effect } from '@angular/core';
import { user } from './user';
import { RxStomp, RxStompState } from '@stomp/rx-stomp';
import {
  changeServiceStatus,
  ConnectionService,
  ConnectionStatus,
  reportServiceError,
} from 'app/base/connectivity/connectivity';
import { ARSRxStompConfig } from 'app/rx-stomp.config';
import { getInjector } from 'app/base/angular-init';
import { map, switchMap } from 'rxjs';

const client = new RxStomp();
client.webSocketErrors$.subscribe((error) => {
  console.error('[STOMP] WebSocket Error: ', error);
  reportServiceError(ConnectionService.WebSocket, error);
});
client.stompErrors$.subscribe((error) => {
  console.error('[STOMP] STOMP Error: ', error);
  reportServiceError(ConnectionService.WebSocket, error);
});
client.connectionState$.subscribe((state) => {
  if (state === RxStompState.CONNECTING) {
    changeServiceStatus(ConnectionService.WebSocket, ConnectionStatus.Starting);
    return;
  }
  changeServiceStatus(
    ConnectionService.WebSocket,
    state === RxStompState.OPEN
      ? ConnectionStatus.Available
      : ConnectionStatus.Error,
  );
});

const headers = {
  'content-type': 'application/json',
  'ars-user-id': '',
};
export const getWatcher = (topic: string, additionalHeaders = {}) => {
  return client.connected$.pipe(
    switchMap(() =>
      client.watch(topic, {
        ...headers,
        ...additionalHeaders,
      }),
    ),
  );
};

export const send = (
  destination: string,
  body: string,
  additionalHeaders = {},
) => {
  return client.connected$.pipe(
    map(() =>
      client.publish({
        destination,
        body,
        headers: {
          ...headers,
          ...additionalHeaders,
        },
      }),
    ),
  );
};

const onTokenUpdate = (token?: string) => {
  client.deactivate().then(() => {
    const copiedConf = { ...ARSRxStompConfig };
    copiedConf.connectHeaders['token'] = token;
    client.configure(copiedConf);
    client.activate();
  });
};

// side effects

onTokenUpdate();

getInjector().subscribe((injector) => {
  effect(
    () => {
      const u = user();
      headers['ars-user-id'] = u?.id ? u.id : '';
      onTokenUpdate(u?.token);
    },
    {
      injector,
    },
  );
});
