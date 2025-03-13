import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { UserRole } from 'app/models/user-roles.enum';
import { getWatcher } from 'app/user/state/websocket';

@Injectable({
  providedIn: 'root',
})
export class WsCommentService {
  getCommentStream(roomId: string, role: UserRole): Observable<IMessage> {
    return getWatcher(`/topic/${roomId}.comment.stream`, {
      'ars-role': role,
    });
  }

  getModeratorCommentStream(roomId: string): Observable<IMessage> {
    return getWatcher(`/topic/${roomId}.comment.moderator.stream`);
  }
}
