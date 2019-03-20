import { Injectable } from '@angular/core';
import { Comment } from '../../models/comment';
import { RxStompService } from '@stomp/ng2-stompjs';
import { CreateComment } from '../../models/messages/create-comment';
import { PatchComment } from '../../models/messages/patch-comment';


@Injectable({
  providedIn: 'root'
})
export class WsCommentServiceService {

  constructor(private rxStompService: RxStompService) { }

  add(comment: Comment): void {
    const message = new CreateComment(comment.roomId, comment.userId, comment.body);
    this.rxStompService.publish({
      destination: `/queue/comment.command`,
      body: JSON.stringify(message),
      headers: {
        'content-type': 'application/json'
      }
    });
  }

  toggleRead(comment: Comment): Comment {
    comment.read = !comment.read;
    const payload = new Map<string, any>();
    payload.set('mark', comment.read);
    this.patchComment(comment, payload);
    return comment;
  }

  toggleFavorite(comment: Comment): Comment {
    comment.favorite = !comment.favorite;
    const payload = new Map<string, any>();
    payload.set('correct', comment.read);
    this.patchComment(comment, payload);
    return comment;
  }

  toggleCorrect(comment: Comment): Comment {
    comment.correct = !comment.correct;
    const payload = new Map<string, any>();
    payload.set('correct', comment.read);
    this.patchComment(comment, payload);
    return comment;
  }

  private patchComment(comment: Comment, changes: Map<string, any>): void {
    const message = new PatchComment(comment.id, changes);
      this.rxStompService.publish({
        destination: `/queue/comment.command`,
        body: JSON.stringify(message),
        headers: {
          'content-type': 'application/json'
        }
      });
    }
}
