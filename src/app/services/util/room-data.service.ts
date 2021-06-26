import { Injectable } from '@angular/core';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { WsCommentService } from '../websockets/ws-comment.service';
import { Message } from '@stomp/stompjs';
import { Comment } from '../../models/comment';
import { CommentService } from '../http/comment.service';
import { CorrectWrong } from '../../models/correct-wrong.enum';
import { RoomService } from '../http/room.service';
import { TopicCloudAdminService } from './topic-cloud-admin.service';
import { ProfanityFilterType } from '../../models/room';

export interface UpdateInformation {
  type: 'CommentCreated' | 'CommentPatched' | 'CommentHighlighted' | 'CommentDeleted';
  subtype?: string;
  comment: Comment;
  finished?: boolean;
  updates?: string[];
}

class RoomDataUpdateSubscription {
  updateSubject = new Subject<UpdateInformation>();
  private readonly _filters: Partial<UpdateInformation>[];

  constructor(filters: Partial<UpdateInformation>[]) {
    this._filters = filters;
  }

  onUpdate(event: UpdateInformation): void {
    for (const filter of this._filters) {
      if (this.ensureEqual(filter, event)) {
        this.updateSubject.next(event);
        break;
      }
    }
  }

  /**
   * Checks if value1 is a subset of value2
   */
  private ensureEqual(value1: any, value2: any): boolean {
    if (Array.isArray(value1)) {
      if (!Array.isArray(value2)) {
        return false;
      }
      for (const key of value1) {
        let same = false;
        for (const otherKey of value2) {
          if (this.ensureEqual(key, otherKey)) {
            same = true;
            break;
          }
        }
        if (!same) {
          return false;
        }
      }
      return true;
    } else if (typeof value1 === 'object') {
      if (typeof value2 !== 'object') {
        return false;
      }
      const keys = Object.keys(value1);
      for (const key of keys) {
        if (!this.ensureEqual(value1[key], value2[key])) {
          return false;
        }
      }
      return true;
    }
    return value1 === value2;
  }
}

enum UpdateType {
  force,
  commentStream
}

interface FastRoomAccessObject {
  [commentId: string]: Comment;
}

@Injectable({
  providedIn: 'root'
})
export class RoomDataService {

  private _currentSubscriptions: RoomDataUpdateSubscription[] = [];
  private _currentComments: Comment[] = null;
  private _commentUpdates: Subject<Comment[]> = new Subject<Comment[]>();
  private _fastCommentAccess: FastRoomAccessObject = null;
  private _wsCommentServiceSubscription: Subscription = null;
  private _currentRoomId: string = null;
  private _savedCommentsBeforeFilter = new Map();
  private _savedCommentsAfterFilter = new Map();

  constructor(private wsCommentService: WsCommentService,
              private commentService: CommentService,
              private roomService: RoomService,
              private topicCloudAdminService: TopicCloudAdminService) {
  }

  get currentRoomData() {
    return this._currentComments;
  }

  receiveUpdates(updateFilter: Partial<UpdateInformation>[]): Observable<UpdateInformation> {
    if (!this._currentRoomId) {
      console.error('Update Subscription got not registered, room is not bound!');
      return null;
    }
    const subscription = new RoomDataUpdateSubscription(updateFilter);
    this._currentSubscriptions.push(subscription);
    return subscription.updateSubject.asObservable();
  }

  getRoomData(roomId: string, freezed: boolean = false): Observable<Comment[]> {
    if (roomId && roomId === this._currentRoomId) {
      this.checkProfanity();
      return of(freezed ? [...this._currentComments] : this._currentComments);
    }
    const tempSubject = new Subject<Comment[]>();
    const subscription = this._commentUpdates.subscribe(comments => {
      tempSubject.next(freezed ? [...comments] : comments);
      subscription.unsubscribe();
    });
    this.ensureRoomBinding(roomId);
    return tempSubject.asObservable();
  }

  private checkProfanity() {
    this.roomService.getRoom(localStorage.getItem('roomId')).subscribe(room => {
      if (room.profanityFilter !== ProfanityFilterType.none) {
        this._currentComments.forEach(comment => {
          comment.body = this._savedCommentsAfterFilter.get(comment.id);
        });
      } else {
        this._currentComments.forEach(comment => {
          comment.body = this._savedCommentsBeforeFilter.get(comment.id);
        });
      }
    });
  }

  private setCommentBodies(comment: Comment) {
    this._savedCommentsBeforeFilter.set(comment.id, comment.body);
    this._savedCommentsAfterFilter.set(comment.id, this.topicCloudAdminService.filterProfanityWords(comment.body));
  }

  private removeCommentBodies(key: string) {
    this._savedCommentsBeforeFilter.delete(key);
    this._savedCommentsAfterFilter.delete(key);
  }

  private ensureRoomBinding(roomId: string) {
    if (!roomId || roomId === this._currentRoomId) {
      return;
    }
    this._currentSubscriptions.length = 0;
    this._currentRoomId = roomId;
    this._currentComments = null;
    this._fastCommentAccess = {};
    if (this._wsCommentServiceSubscription) {
      this._wsCommentServiceSubscription.unsubscribe();
    }
    this._wsCommentServiceSubscription = this.wsCommentService.getCommentStream(roomId)
      .subscribe(msg => this.onMessageReceive(msg));
    this.commentService.getAckComments(roomId).subscribe(comments => {
      this._currentComments = comments;
      for (const comment of comments) {
        this.setCommentBodies(comment);
        this._fastCommentAccess[comment.id] = comment;
      }
      this.triggerUpdate(UpdateType.force, null);
    });
  }

  private triggerUpdate(type: UpdateType, additionalInformation: UpdateInformation) {
    if ((additionalInformation && additionalInformation.type === 'CommentCreated') || !additionalInformation) {
      this.checkProfanity();
    }
    if (type === UpdateType.force) {
      this._commentUpdates.next(this._currentComments);
    } else if (type === UpdateType.commentStream) {
      for (const subscription of this._currentSubscriptions) {
        subscription.onUpdate(additionalInformation);
      }
    }
  }

  private onMessageReceive(message: Message) {
    const msg = JSON.parse(message.body);
    const payload = msg.payload;
    switch (msg.type) {
      case 'CommentCreated':
        this.onCommentCreate(payload);
        break;
      case 'CommentPatched':
        this.onCommentPatched(payload);
        break;
      case 'CommentHighlighted':
        this.onCommentHighlighted(payload);
        break;
      case 'CommentDeleted':
        this.onCommentDeleted(payload);
        break;
    }
  }

  private onCommentCreate(payload: any) {
    const c = new Comment();
    c.roomId = this._currentRoomId;
    c.body = payload.body;
    c.id = payload.id;
    c.timestamp = payload.timestamp;
    c.tag = payload.tag;
    c.creatorId = payload.creatorId;
    c.userNumber = this.commentService.hashCode(c.creatorId);
    c.keywordsFromQuestioner = JSON.parse(payload.keywordsFromQuestioner);
    this._fastCommentAccess[c.id] = c;
    this._currentComments.push(c);
    this.triggerUpdate(UpdateType.commentStream, {
      type: 'CommentCreated',
      finished: false,
      comment: c
    });
    this.commentService.getComment(c.id).subscribe(comment => {
      for (const key of Object.keys(comment)) {
        c[key] = comment[key];
      }
      this.setCommentBodies(c);
      this.triggerUpdate(UpdateType.commentStream, {
        type: 'CommentCreated',
        finished: true,
        comment: c
      });
    });
  }

  private onCommentPatched(payload: any) {
    const comment = this._fastCommentAccess[payload.id];
    if (!comment) {
      console.error('comment ' + payload.id + ' was not found!');
      return;
    }
    const updates = [];
    for (const [key, value] of Object.entries(payload.changes)) {
      updates.push(key);
      switch (key) {
        case 'read':
          comment.read = value as boolean;
          this.triggerUpdate(UpdateType.commentStream, {
            type: 'CommentPatched',
            subtype: 'read',
            comment
          });
          break;
        case 'correct':
          comment.correct = value as CorrectWrong;
          this.triggerUpdate(UpdateType.commentStream, {
            type: 'CommentPatched',
            subtype: 'correct',
            comment
          });
          break;
        case 'favorite':
          comment.favorite = value as boolean;
          this.triggerUpdate(UpdateType.commentStream, {
            type: 'CommentPatched',
            subtype: 'favorite',
            comment
          });
          break;
        case 'bookmark':
          comment.bookmark = value as boolean;
          this.triggerUpdate(UpdateType.commentStream, {
            type: 'CommentPatched',
            subtype: 'bookmark',
            comment
          });
          break;
        case 'score':
          comment.score = value as number;
          this.triggerUpdate(UpdateType.commentStream, {
            type: 'CommentPatched',
            subtype: 'score',
            comment
          });
          break;
        case 'upvotes':
          comment.upvotes = value as number;
          break;
        case 'downvotes':
          comment.downvotes = value as number;
          break;
        case 'keywordsFromSpacy':
          comment.keywordsFromSpacy = JSON.parse(value as string);
          break;
        case 'keywordsFromQuestioner':
          comment.keywordsFromQuestioner = JSON.parse(value as string);
          break;
        case 'ack':
          const isNowAck = value as boolean;
          comment.ack = isNowAck;
          if (!isNowAck) {
            this.removeComment(payload.id);
          }
          this.triggerUpdate(UpdateType.commentStream, {
            type: 'CommentPatched',
            subtype: 'ack',
            comment
          });
          break;
        case 'tag':
          comment.tag = value as string;
          this.triggerUpdate(UpdateType.commentStream, {
            type: 'CommentPatched',
            subtype: 'tag',
            comment
          });
          break;
        case 'answer':
          comment.answer = value as string;
          this.triggerUpdate(UpdateType.commentStream, {
            type: 'CommentPatched',
            subtype: 'answer',
            comment
          });
          break;
      }
    }
    this.triggerUpdate(UpdateType.commentStream, {
      type: 'CommentPatched',
      finished: true,
      updates,
      comment
    });
  }

  private onCommentHighlighted(payload: any) {
    const comment = this._fastCommentAccess[payload.id];
    if (!comment) {
      console.error('comment ' + payload.id + ' was not found!');
      return;
    }
    comment.highlighted = payload.lights as boolean;
    this.triggerUpdate(UpdateType.commentStream, {
      type: 'CommentHighlighted',
      finished: true,
      comment
    });
  }

  private onCommentDeleted(payload: any) {
    const comment = this._fastCommentAccess[payload.id];
    if (!comment) {
      console.error('comment ' + payload.id + ' was not found!');
      return;
    }
    this.removeComment(payload.id);
    this.triggerUpdate(UpdateType.commentStream, {
      type: 'CommentDeleted',
      finished: true,
      comment
    });
  }

  private removeComment(id: string) {
    const index = this._currentComments.findIndex(el => el.id === id);
    if (index >= 0) {
      this._currentComments.splice(index, 1);
      this.removeCommentBodies(id);
    }
    this._fastCommentAccess[id] = undefined;
  }
}
