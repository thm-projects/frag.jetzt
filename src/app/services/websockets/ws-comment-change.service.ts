import { Injectable } from '@angular/core';
import { WsConnectorService } from './ws-connector.service';
import { Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class WsCommentChangeService {

  constructor(
    private wsConnector: WsConnectorService
  ) {
  }

  getRoomStream(roomId: string): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/${roomId}.comment-change.stream`);
  }

  getCommentStream(roomId: string, commentId: string): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/${roomId}.comment-change.${commentId}.stream`);
  }
}
