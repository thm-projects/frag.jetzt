import { Injectable } from '@angular/core';
import { Comment } from '../../models/comment';
import { WsConnectorService } from '../../services/websockets/ws-connector.service';
import { CreateComment } from '../../models/messages/create-comment';
import { PatchComment } from '../../models/messages/patch-comment';
import { HighlightComment } from '../../models/messages/highlight-comment';
import { TSMap } from 'typescript-map';
import { UpVote } from '../../models/messages/up-vote';
import { DownVote } from '../../models/messages/down-vote';
import { ResetVote } from '../../models/messages/reset-vote';
import { Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';


@Injectable({
  providedIn: 'root'
})
export class WsCommentServiceService {

  constructor(private wsConnector: WsConnectorService) { }

  getCommentStream(roomId: string): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/${roomId}.comment.stream`);
  }

  getModeratorCommentStream(roomId: string): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/${roomId}.comment.moderator.stream`);
  }
}
