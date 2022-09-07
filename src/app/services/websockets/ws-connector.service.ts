import { Injectable } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import { User } from '../../models/user';
import { ARSRxStompConfig } from '../../rx-stomp.config';
import { BehaviorSubject, Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { UserManagementService } from '../util/user-management.service';

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

  private deactivationPromise: Promise<void>;
  private isConnecting: boolean = false;

  constructor(
    private userManagementService: UserManagementService,
  ) {
    this.client = new RxStomp();
    this.client.connectionState$.subscribe(() => {
      const connected = !!this.client.stompClient.connected;
      if (this.connected$.value !== connected) {
        this.connected$.next(connected);
      }
    });
    userManagementService.getUser().subscribe((user: User) => {
      this.onUserUpdate(user);
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

  private onUserUpdate(user: User) {
    const state = this.client.connectionState$.value;
    const isOpenOrConnecting = state === 0 || state === 1;
    if (!user) {
      if (this.deactivationPromise || !isOpenOrConnecting) {
        return;
      }
      this.headers = {
        'content-type': 'application/json',
        'ars-user-id': ''
      };
      this.deactivationPromise = this.client.deactivate().then(() => {
        this.deactivationPromise = null;
      });
      return;
    }
    this.headers = {
      'content-type': 'application/json',
      'ars-user-id': String(user.id)
    };
    const copiedConf = { ...ARSRxStompConfig };
    copiedConf.connectHeaders.token = user.token;
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
