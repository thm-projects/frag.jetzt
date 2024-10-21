import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { getWatcher } from 'app/user/state/websocket';

@Injectable({
  providedIn: 'root',
})
export class WsRoomService {
  getRoomStream(roomId: string): Observable<IMessage> {
    return getWatcher(`/topic/${roomId}.room.stream`);
  }
}
