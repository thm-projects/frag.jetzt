import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WsConnectorService } from './ws-connector.service';
import { IMessage } from '@stomp/stompjs';
import { UserRole } from 'app/models/user-roles.enum';

@Injectable({
  providedIn: 'root',
})
export class WsLivepollService {
  constructor(private wsConnector: WsConnectorService) {}

  getLivepollUserCountStream(
    livepollId: string,
    role: UserRole,
  ): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/${livepollId}.livepoll.stream`, {
      'ars-role': role,
    });
  }
}
