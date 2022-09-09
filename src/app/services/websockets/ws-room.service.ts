import { Injectable } from '@angular/core';
import { WsConnectorService } from './ws-connector.service';
import { Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class WsRoomService {

  constructor(
    private wsConnector: WsConnectorService,
  ) {
  }

  getRoomStream(roomId: string): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/${roomId}.room.stream`);
  }
}
