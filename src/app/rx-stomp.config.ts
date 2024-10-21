import { RxStompConfig } from '@stomp/rx-stomp';
import { environment } from '../environments/environment';

export const ARSRxStompConfig: RxStompConfig = {
  // Which server?
  brokerURL:
    (window.location.protocol === 'http:' ? 'ws' : 'wss') +
    `://${window.location.host}/gateway/ws/websocket`,

  connectHeaders: {
    login: 'guest',
    password: 'guest',
  },

  // How often to heartbeat?
  // Interval in milliseconds, set to 0 to disable
  heartbeatIncoming: 0, // Typical value 0 - disabled
  heartbeatOutgoing: 20000, // Typical value 20000 - every 20 seconds

  // Wait in milliseconds before attempting auto reconnect
  // Set to 0 to disable
  // Typical value 500 (500 milli seconds)
  reconnectDelay: 1000,

  // Will log diagnostics on console
  // It can be quite verbose, not recommended in production
  // Skip this key to stop logging to console
  debug: (msg: string): void => {
    if (environment.stomp_debug) {
      console.debug(
        `%c${new Date().toLocaleString()} %cSTOMP debug: %c${msg}`,
        'color: lightblue;',
        'color: turquoise;',
        'color: lightgreen',
      );
    }
  },
};
