import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { getWatcher } from 'app/user/state/websocket';

@Injectable({
  providedIn: 'root',
})
export class WsCommentChangeService {
  getRoomStream(roomId: string): Observable<IMessage> {
    return getWatcher(`/topic/${roomId}.comment-change.stream`);
  }

  getCommentStream(roomId: string, commentId: string): Observable<IMessage> {
    return getWatcher(`/topic/${roomId}.comment-change.${commentId}.stream`);
  }
}
