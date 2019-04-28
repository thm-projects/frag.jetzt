import { Injectable } from '@angular/core';
import { Comment } from '../../models/comment';
import { WsConnectorService } from '../../services/websockets/ws-connector.service';
import { CreateComment } from '../../models/messages/create-comment';
import { PatchComment } from '../../models/messages/patch-comment';
import { HighlightComment } from '../../models/messages/highlight-comment';
import { TSMap } from 'typescript-map';
import { UpVote } from '../../models/messages/up-vote';
import { DownVote } from '../../models/messages/down-vote';
import { Observable } from 'rxjs';
import { IMessage } from '@stomp/stompjs';


@Injectable({
  providedIn: 'root'
})
export class WsCommentServiceService {

  constructor(private wsConnector: WsConnectorService) { }

  add(comment: Comment): void {
    const message = new CreateComment(comment.roomId, comment.userId, comment.body);
    this.wsConnector.send(`/queue/comment.command.create`, JSON.stringify(message));
  }

  toggleRead(comment: Comment): Comment {
    console.log(comment);
    comment.read = !comment.read;
    const changes = new TSMap<string, any>();
    changes.set('read', comment.read);
    this.patchComment(comment, changes);
    return comment;
  }

  toggleFavorite(comment: Comment): Comment {
    comment.favorite = !comment.favorite;
    const changes = new TSMap<string, any>();
    changes.set('favorite', comment.favorite);
    this.patchComment(comment, changes);
    return comment;
  }

  toggleCorrect(comment: Comment): Comment {
    comment.correct = !comment.correct;
    const changes = new TSMap<string, any>();
    changes.set('correct', comment.correct);
    this.patchComment(comment, changes);
    return comment;
  }

  voteUp(comment: Comment): void {
    const message = new UpVote(comment.userId, comment.id);
    this.wsConnector.send(`/queue/vote.command.upvote`, JSON.stringify(message));
  }

  voteDown(comment: Comment): void {
    const message = new DownVote(comment.userId, comment.id);
    this.wsConnector.send(`/queue/vote.command.downvote`, JSON.stringify(message));
  }

  private patchComment(comment: Comment, changes: TSMap<string, any>): void {
    const message = new PatchComment(comment.id, changes);
    this.wsConnector.send(`/queue/comment.command.patch`, JSON.stringify(message));
  }

  highlight(comment: Comment) {
    const message = new HighlightComment(comment.id, true);
    this.wsConnector.send(`/queue/comment.command.highlight`, JSON.stringify(message));
  }

  lowlight(comment: Comment) {
    const message = new HighlightComment(comment.id, false);
    this.wsConnector.send(`/queue/comment.command.highlight`, JSON.stringify(message));
  }

  getCommentStream(roomId: string): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/${roomId}.comment.stream`);
  }
}
