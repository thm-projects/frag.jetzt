import { Injectable } from '@angular/core';
import { RxStomp, RxStompState } from '@stomp/rx-stomp';
import { User } from '../../models/user';
import { ARSRxStompConfig } from '../../rx-stomp.config';
import { BehaviorSubject, Observable, filter, switchMap, take } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { user$ } from 'app/user/state/user';

@Injectable({
  providedIn: 'root',
})
export class WsConnectorService {
  public readonly connected$ = new BehaviorSubject<boolean>(false);
  private client: RxStomp;

  private headers = {
    'content-type': 'application/json',
    'ars-user-id': '',
  };

  private deactivationPromise: Promise<void>;
  private isConnecting: boolean = false;

  constructor() {
    this.client = new RxStomp();
    this.client.connectionState$.subscribe(() => {
      const connected = !!this.client.stompClient.connected;
      if (this.connected$.value !== connected) {
        this.connected$.next(connected);
      }
    });
    user$.subscribe((user: User) => {
      this.onUserUpdate(user);
    });
  }

  public send(destination: string, body: string): void {
    if (this.client.connected) {
      this.client.publish({
        destination,
        body,
        headers: this.headers,
      });
    }
  }

  public getWatcher(
    topic: string,
    additionalHeaders = {},
  ): Observable<IMessage> {
    return this.client.connected$.pipe(
      filter((connected) => connected === RxStompState.OPEN),
      take(1),
      switchMap(() =>
        this.client.watch(topic, {
          ...this.headers,
          ...additionalHeaders,
        }),
      ),
    );
  }

  private onUserUpdate(user: User) {
    const state = this.client.connectionState$.value;
    const isOpenOrConnecting = state === 0 || state === 1;
    if (!user) {
      if (this.deactivationPromise || !isOpenOrConnecting) {
        return;
      }
      this.headers = {
        'content-type': 'application/json',
        'ars-user-id': '',
      };
      this.deactivationPromise = this.client.deactivate().then(() => {
        this.deactivationPromise = null;
      });
      return;
    }
    this.headers = {
      'content-type': 'application/json',
      'ars-user-id': String(user.id),
    };
    const copiedConf = { ...ARSRxStompConfig };
    copiedConf.connectHeaders['token'] = user.token;
    this.client.configure(copiedConf);
    if (this.isConnecting) {
      return;
    }
    if (this.deactivationPromise) {
      this.isConnecting = true;
      this.deactivationPromise.then(() => {
        this.client.activate();
        this.isConnecting = false;
      });
    } else if (!isOpenOrConnecting) {
      this.client.activate();
    }
  }
}
