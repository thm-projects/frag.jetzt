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

  add(comment: Comment): void {
    const message = new CreateComment(comment.roomId, comment.creatorId, comment.body, comment.tag);
    this.wsConnector.send(`/queue/comment.command.create`, JSON.stringify(message));
  }

  answer(comment: Comment, answer: string): Comment {
    comment.answer = answer;
    const changes = new TSMap<string, any>();
    changes.set('answer', comment.answer);
    this.patchComment(comment, changes);
    return comment;
  }

  toggleRead(comment: Comment): Comment {
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

  markCorrect(comment: Comment): Comment {
    const changes = new TSMap<string, any>();
    changes.set('correct', comment.correct);
    this.patchComment(comment, changes);
    return comment;
  }

  toggleAck(comment: Comment): Comment {
    comment.ack = !comment.ack;
    const changes = new TSMap<string, any>();
    changes.set('ack', comment.ack);
    this.patchComment(comment, changes);
    return comment;
  }

  voteUp(comment: Comment, userId: string): void {
    const message = new UpVote(userId, comment.id);
    this.wsConnector.send(`/queue/vote.command.upvote`, JSON.stringify(message));
  }

  voteDown(comment: Comment, userId: string): void {
    const message = new DownVote(userId, comment.id);
    this.wsConnector.send(`/queue/vote.command.downvote`, JSON.stringify(message));
  }

  resetVote(comment: Comment, userId: string): void {
    const message = new ResetVote(userId, comment.id);
    this.wsConnector.send(`/queue/vote.command.resetvote`, JSON.stringify(message));
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

  getModeratorCommentStream(roomId: string): Observable<IMessage> {
    return this.wsConnector.getWatcher(`/topic/${roomId}.comment.moderator.stream`);
  }
}
