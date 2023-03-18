import { Injectable } from '@angular/core';
import { WsConnectorService } from './ws-connector.service';
import { Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { UserRole } from 'app/models/user-roles.enum';

@Injectable({
  providedIn: 'root',
})
export class WsCommentService {
  constructor(private wsConnector: WsConnectorService) {}

  getCommentStream(roomId: string, role: UserRole): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/${roomId}.comment.stream`, {
      'ars-role': role,
    });
  }

  getModeratorCommentStream(roomId: string): Observable<IMessage> {
    return this.wsConnector.getWatcher(
      `/topic/${roomId}.comment.moderator.stream`,
    );
  }
}
