import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WsConnectorService } from './ws-connector.service';
import { IMessage } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root',
})
export class WsLivepollService {
  constructor(private wsConnector: WsConnectorService) {}

  getLivepollUserCountStream(livepollId: string): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/${livepollId}.livepoll.stream`);
  }
}
