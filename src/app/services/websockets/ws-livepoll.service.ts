import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { UserRole } from 'app/models/user-roles.enum';
import { getWatcher } from 'app/user/state/websocket';

@Injectable({
  providedIn: 'root',
})
export class WsLivepollService {
  getLivepollUserCountStream(
    livepollId: string,
    role: UserRole,
  ): Observable<IMessage> {
    return getWatcher(`/topic/${livepollId}.livepoll.stream`, {
      'ars-role': role,
    });
  }
}
