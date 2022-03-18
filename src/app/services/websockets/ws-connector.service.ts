 import { Injectable } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { AuthenticationService } from '../http/authentication.service';
import { User } from '../../models/user';
import { ARSRxStompConfig } from '../../rx-stomp.config';
import { BehaviorSubject, Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class WsConnectorService {
  public readonly connected$ = new BehaviorSubject<boolean>(false);
  private client: RxStomp;

  private headers = {
    'content-type': 'application/json',
    'ars-user-id': ''
  };

  constructor(
    private authService: AuthenticationService
  ) {
    this.client = new RxStomp();
    this.client.connectionState$.subscribe(() => {
      const connected = !!this.client.stompClient.connected;
      if (this.connected$.value !== connected) {
        this.connected$.next(connected);
      }
    });
    const userSubject = authService.getUserAsSubject();
    userSubject.subscribe((user: User) => {
      let deactivate: Promise<void>;
      if (this.client.connected) {
        deactivate = this.client.deactivate();
      } else {
        deactivate = new Promise<void>(resolve => resolve());
      }
      if (!user?.id) {
        return;
      }
      deactivate.then(() => {
        const copiedConf = { ...ARSRxStompConfig };
        copiedConf.connectHeaders.token = user.token;
        this.headers = {
          'content-type': 'application/json',
          'ars-user-id': String(user.id)
        };
        this.client.configure(copiedConf);
        this.client.activate();
      });
    });
  }

  public send(destination: string, body: string): void {
    if (this.client.connected) {
      this.client.publish({
        destination,
        body,
        headers: this.headers
      });
    }
  }

  public getWatcher(topic: string): Observable<IMessage> {
    if (this.client.connected) {
      return this.client.watch(topic, this.headers);
    }
  }
}
