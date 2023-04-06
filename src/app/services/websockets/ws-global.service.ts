import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WsConnectorService } from './ws-connector.service';
import { IMessage } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root',
})
export class WsGlobalService {
  constructor(private wsConnector: WsConnectorService) {}

  getGlobalCountStream(): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/global`);
  }
}
