import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { WsCommentService } from '../websockets/ws-comment.service';
import { Message } from '@stomp/stompjs';
import { Comment } from '../../models/comment';
import { CommentService } from '../http/comment.service';
import { CorrectWrong } from '../../models/correct-wrong.enum';
import { ProfanityFilterService } from './profanity-filter.service';
import { ProfanityFilter, Room } from '../../models/room';
import { SessionService } from './session.service';
import { UserRole } from '../../models/user-roles.enum';
import { AuthenticationService } from '../http/authentication.service';
import { CommentFilterData, RoomDataProfanityFilter } from './room-data.profanity-filter';
import { filter, map, take } from 'rxjs/operators';
import { ActiveUserService } from '../http/active-user.service';
import { BookmarkService } from '../http/bookmark.service';
import { Bookmark } from '../../models/bookmark';

export interface UpdateInformation {
  type: 'CommentCreated' | 'CommentPatched' | 'CommentHighlighted' | 'CommentDeleted';
  subtype?: (keyof Comment);
  comment: Comment;
  finished?: boolean;
  updates?: (keyof Comment)[];
}

export interface CommentWithMeta extends Comment {
  meta: {
    children: Set<string>;
    removed: boolean;
    created: boolean;
    responseCount: number;
    responsesFromParticipants: number;
  };
}

class RoomDataUpdateSubscription {
  updateSubject = new Subject<UpdateInformation>();
  private readonly _filters: Partial<UpdateInformation>[];

  constructor(filters: Partial<UpdateInformation>[]) {
    this._filters = filters;
  }

  onUpdate(event: UpdateInformation): void {
    for (const updateFilter of this._filters) {
      if (this.ensureEqual(updateFilter, event)) {
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
      return this.checkArrayIsSubset(value1, value2);
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

  private checkArrayIsSubset(value1: any[], value2: any) {
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
  }
}

interface FastRoomAccessObject {
  [commentId: string]: {
    comment: CommentWithMeta;
    beforeFiltering: CommentFilterData;
    afterFiltering: CommentFilterData;
    hasProfanity: boolean;
    filtered: boolean;
  };
}

interface BookmarkAccess {
  [commentId: string]: Bookmark;
}

@Injectable({
  providedIn: 'root'
})
export class RoomDataService {

  private _currentSubscriptions: RoomDataUpdateSubscription[] = [];
  private _currentRoomComments: BehaviorSubject<CommentWithMeta[]> = new BehaviorSubject<CommentWithMeta[]>(null);
  private _fastCommentAccess: FastRoomAccessObject = null;
  private _commentServiceSubscription: Subscription = null;
  private _canAccessModerator = false;
  private _currentNackSubscriptions: RoomDataUpdateSubscription[] = [];
  private _currentNackRoomComments: BehaviorSubject<CommentWithMeta[]> = new BehaviorSubject<CommentWithMeta[]>(null);
  private _fastNackCommentAccess: FastRoomAccessObject = null;
  private _nackCommentServiceSubscription: Subscription = null;
  private readonly _filter: RoomDataProfanityFilter;
  private _currentUserCount = new BehaviorSubject<string>('?');
  private _userBookmarks: BookmarkAccess = {};

  constructor(
    private wsCommentService: WsCommentService,
    private commentService: CommentService,
    private sessionService: SessionService,
    private profanityFilterService: ProfanityFilterService,
    private authenticationService: AuthenticationService,
    private activeUserService: ActiveUserService,
    private bookmarkService: BookmarkService,
  ) {
    this._filter = new RoomDataProfanityFilter(profanityFilterService);
    this.sessionService.getRoom().subscribe(room => this.onRoomUpdate(room));
    this.authenticationService.watchUser.subscribe(_ => this.updateBookmarks());
    this.sessionService.getRole().subscribe(role => {
      const comments = this._currentRoomComments.value;
      if (!comments) {
        return;
      }
      if (role === UserRole.PARTICIPANT) {
        comments.forEach(c => {
          c['globalBookmark'] = c.bookmark;
          c.bookmark = !!this._userBookmarks[c.id];
        });
        return;
      }
      comments.forEach(c => {
        c.bookmark = c['globalBookmark'] || c.bookmark;
        c['globalBookmark'] = null;
      });
    });
  }

  get canAccessModerator() {
    return this._canAccessModerator;
  }

  private static addMeta(comment: Comment): CommentWithMeta {
    const commentWithMeta = comment as CommentWithMeta;
    commentWithMeta.meta = {
      children: new Set(),
      created: false,
      removed: false,
      responseCount: 0,
      responsesFromParticipants: 0,
    };
    return commentWithMeta;
  }

  observeUserCount(): Observable<string> {
    return this._currentUserCount.asObservable();
  }

  getCurrentRoomData(isModeration = false): Comment[] {
    const source = isModeration ? this._currentNackRoomComments : this._currentRoomComments;
    return source.getValue();
  }

  receiveUpdates(updateFilter: Partial<UpdateInformation>[], isModeration = false): Observable<UpdateInformation> {
    if (!this.sessionService.currentRoom) {
      console.error('Update Subscription got not registered, room is not bound!');
      return null;
    }
    const source = isModeration ? this._currentNackSubscriptions : this._currentSubscriptions;
    const subscription = new RoomDataUpdateSubscription(updateFilter);
    source.push(subscription);
    return subscription.updateSubject.asObservable();
  }

  getRoomData(isModeration = false): Observable<CommentWithMeta[]> {
    const source = isModeration ? this._currentNackRoomComments : this._currentRoomComments;
    return source.asObservable();
  }

  getRoomDataOnce(freezed = false, isModeration = false): Observable<CommentWithMeta[]> {
    const source = isModeration ? this._currentNackRoomComments : this._currentRoomComments;
    return source.asObservable().pipe(
      filter(v => !!v),
      take(1),
      map(data => freezed ? [...data] : data)
    );
  }

  applyStateToComment(comment: Comment, beforeFilter: boolean, isModeration = false) {
    const source = isModeration ? this._fastNackCommentAccess[comment.id] : this._fastCommentAccess[comment.id];
    const data = beforeFilter ? source.beforeFiltering : source.afterFiltering;
    this._filter.applyToComment(comment, data);
    source.filtered = !beforeFilter;
  }

  isCommentProfane(comment: Comment, isModeration = false): boolean {
    const source = isModeration ? this._fastNackCommentAccess[comment.id] : this._fastCommentAccess[comment.id];
    return source.hasProfanity;
  }

  checkCommentProfanity(comment: Comment): boolean {
    return !!(this._fastCommentAccess[comment.id] || this._fastNackCommentAccess[comment.id])?.hasProfanity;
  }

  isCommentCensored(comment: Comment, isModeration = false): boolean {
    const source = isModeration ? this._fastNackCommentAccess[comment.id] : this._fastCommentAccess[comment.id];
    return source.filtered;
  }

  getCensoredInformation(comment: Comment, isModeration = false): CommentFilterData {
    const source = isModeration ? this._fastNackCommentAccess[comment.id] : this._fastCommentAccess[comment.id];
    return source?.afterFiltering;
  }

  getCommentReference(id: string): CommentWithMeta {
    return (this._fastCommentAccess[id] || this._fastNackCommentAccess[id])?.comment;
  }

  toggleBookmark(comment: Comment) {
    comment.bookmark = !comment.bookmark;
    if (comment.bookmark) {
      this.bookmarkService.create({ commentId: comment.id }).subscribe({
        next: bookmark => this._userBookmarks[comment.id] = bookmark,
        error: _ => comment.bookmark = !comment.bookmark
      });
      return;
    }
    const id = this._userBookmarks[comment.id]?.id;
    if (!id) {
      return;
    }
    this.bookmarkService.delete(id).subscribe({
      next: _ => this._userBookmarks[comment.id] = undefined,
      error: _ => comment.bookmark = !comment.bookmark
    });
  }

  private updateBookmarks() {
    if (!this.sessionService.currentRoom || this.sessionService.currentRole !== UserRole.PARTICIPANT) {
      return;
    }
    this.bookmarkService.getByRoomId(this.sessionService.currentRoom.id).subscribe(bookmarks => {
      bookmarks.forEach(b => this._userBookmarks[b.commentId] = b);
      const comments = this._currentRoomComments.value;
      if (!comments) {
        return;
      }
      for (const comment of comments) {
        comment.bookmark = !!this._userBookmarks[comment.id];
      }
    });
  }

  private refilterComment(comment: Comment, isModeration: boolean) {
    const source = isModeration ? this._fastNackCommentAccess[comment.id] : this._fastCommentAccess[comment.id];
    if (source.filtered) {
      this._filter.applyToComment(comment, source.beforeFiltering);
    }
    const [beforeFiltering, afterFiltering, hasProfanity] = this._filter
      .filterCommentBody(this.sessionService.currentRoom, comment);
    source.beforeFiltering = beforeFiltering;
    source.afterFiltering = afterFiltering;
    if (!hasProfanity) {
      source.hasProfanity = false;
      source.filtered = false;
    } else if (hasProfanity !== source.hasProfanity) {
      source.hasProfanity = true;
      source.filtered = true;
      this._filter.applyToComment(comment, source.afterFiltering);
    } else if (source.filtered) {
      this._filter.applyToComment(comment, source.afterFiltering);
    }
  }

  private onRoomUpdate(room: Room) {
    this._currentSubscriptions.forEach(sub => sub.updateSubject.complete());
    this._currentSubscriptions.length = 0;
    this._currentNackSubscriptions.forEach(sub => sub.updateSubject.complete());
    this._currentNackSubscriptions.length = 0;
    this._fastCommentAccess = {};
    this._fastNackCommentAccess = {};
    this._currentRoomComments.next(null);
    this._currentNackRoomComments.next(null);
    this._commentServiceSubscription?.unsubscribe();
    this._nackCommentServiceSubscription?.unsubscribe();
    this._currentUserCount.next('?');
    this._userBookmarks = {};
    if (!room) {
      return;
    }
    this.updateBookmarks();
    this.activeUserService.getActiveUser(room)
      .subscribe(([count]) => this._currentUserCount.next(String(count || 0)));
    const filtered = room.profanityFilter !== ProfanityFilter.DEACTIVATED;
    this._commentServiceSubscription = this.wsCommentService.getCommentStream(room.id)
      .subscribe(msg => this.onMessageReceive(msg, false));
    const isUser = this.sessionService.currentRole === UserRole.PARTICIPANT;
    this.commentService.getAckComments(room.id).subscribe(comments => {
      this.sessionService.getModeratorsOnce().subscribe(() =>
        this.onAckCommentReceive(comments.map(comment => RoomDataService.addMeta(comment)), filtered, room, isUser));
    });
    const userRole = this.authenticationService.getUser()?.role || UserRole.PARTICIPANT;
    this._canAccessModerator = userRole > UserRole.PARTICIPANT;
    if (this._canAccessModerator) {
      this._nackCommentServiceSubscription = this.wsCommentService.getModeratorCommentStream(room.id)
        .subscribe(msg => this.onMessageReceive(msg, true));
      this.commentService.getRejectedComments(room.id).subscribe(comments => {
        this.sessionService.getModeratorsOnce().subscribe(() =>
          this.onRejectCommentReceive(comments.map(comment => RoomDataService.addMeta(comment)), filtered, room));
      });
    }
    this.sessionService.receiveRoomUpdates().subscribe(() => {
      this._currentRoomComments.getValue().forEach(comment => this.refilterComment(comment, false));
      if (this._canAccessModerator) {
        this._currentNackRoomComments.getValue().forEach(comment => this.refilterComment(comment, true));
      }
    });
  }

  private onRejectCommentReceive(comments: CommentWithMeta[], filtered: boolean, room: Room) {
    for (const comment of comments) {
      const [beforeFiltering, afterFiltering, hasProfanity] = this._filter.filterCommentBody(room, comment);
      this._fastNackCommentAccess[comment.id] = {
        comment,
        beforeFiltering,
        afterFiltering,
        hasProfanity,
        filtered
      };
      if (filtered) {
        this.applyStateToComment(comment, false, true);
      }
    }
    this.calculateCommentReferences(comments, true);
    this._currentNackRoomComments.next(comments);
  }

  private onAckCommentReceive(comments: CommentWithMeta[], filtered: boolean, room: Room, isUser: boolean) {
    for (const comment of comments) {
      const [beforeFiltering, afterFiltering, hasProfanity] = this._filter.filterCommentBody(room, comment);
      this._fastCommentAccess[comment.id] = {
        comment,
        beforeFiltering,
        afterFiltering,
        hasProfanity,
        filtered
      };
      if (filtered) {
        this.applyStateToComment(comment, false);
      }
    }
    this.calculateCommentReferences(comments, false);
    if (isUser) {
      comments.forEach(c => {
        c['globalBookmark'] = c.bookmark;
        c.bookmark = !!this._userBookmarks[c.id];
      });
    }
    this._currentRoomComments.next(comments);
  }

  private triggerUpdate(information: UpdateInformation, isModeration: boolean) {
    const source = isModeration ? this._currentNackSubscriptions : this._currentSubscriptions;
    source.forEach(sub => sub.onUpdate(information));
  }

  private onMessageReceive(message: Message, isModeration: boolean) {
    const msg = JSON.parse(message.body);
    const payload = msg.payload;
    if (!payload) {
      this._currentUserCount.next(String(msg['UserCountChanged'].userCount));
      return;
    }
    switch (msg.type) {
      case 'CommentCreated':
        this.onCommentCreate(payload, isModeration);
        break;
      case 'CommentPatched':
        this.onCommentPatched(payload, isModeration);
        break;
      case 'CommentHighlighted':
        this.onCommentHighlighted(payload, isModeration);
        break;
      case 'CommentDeleted':
        this.onCommentDeleted(payload, isModeration);
        break;
    }
  }

  private onCommentCreate(payload: any, isModeration: boolean) {
    const room = this.sessionService.currentRoom;
    const c = RoomDataService.addMeta(new Comment());
    c.meta.created = true;
    c.roomId = room.id;
    c.body = payload.body;
    c.id = payload.id;
    c.createdAt = payload.createdAt;
    c.tag = payload.tag;
    c.creatorId = payload.creatorId;
    c.keywordsFromQuestioner = JSON.parse(payload.keywordsFromQuestioner);
    c.language = payload.language;
    c.questionerName = payload.questionerName;
    c.commentReference = payload.commentReference;
    const filtered = room.profanityFilter !== ProfanityFilter.DEACTIVATED;
    const source = isModeration ? this._fastNackCommentAccess : this._fastCommentAccess;
    const [beforeFiltering, afterFiltering, hasProfanity] = this._filter.filterCommentBody(room, c);
    source[c.id] = { comment: c, beforeFiltering, afterFiltering, hasProfanity, filtered };
    this.calculateCommentReferences([c], isModeration);
    if (filtered) {
      this.applyStateToComment(c, false, isModeration);
    }
    const commentSource = isModeration ? this._currentNackRoomComments : this._currentRoomComments;
    commentSource.getValue().push(c);
    this.triggerUpdate({
      type: 'CommentCreated',
      finished: false,
      comment: c
    }, isModeration);
    this.commentService.getComment(c.id).subscribe(comment => {
      for (const key of Object.keys(comment)) {
        c[key] = comment[key];
      }
      if (this.sessionService.currentRole === UserRole.PARTICIPANT) {
        c['globalBookmark'] = c.bookmark;
        c.bookmark = !!this._userBookmarks[c.id];
      }
      this.refilterComment(c, isModeration);
      this.triggerUpdate({
        type: 'CommentCreated',
        finished: true,
        comment: c
      }, isModeration);
    });
  }

  private onCommentPatched(payload: any, isModeration: boolean) {
    const data = isModeration ? this._fastNackCommentAccess[payload.id] : this._fastCommentAccess[payload.id];
    if (!data) {
      console.error('comment ' + payload.id + ' was not found!');
      return;
    }
    const comment = data.comment;
    const updates = [];
    for (const [key, value] of Object.entries(payload.changes)) {
      updates.push(key);
      let hadKey = true;
      switch (key as keyof Comment) {
        case 'read':
          comment.read = value as boolean;
          break;
        case 'correct':
          comment.correct = value as CorrectWrong;
          break;
        case 'favorite':
          comment.favorite = value as boolean;
          break;
        case 'bookmark':
          if (this.sessionService.currentRole > UserRole.PARTICIPANT) {
            comment.bookmark = value as boolean;
          } else {
            comment['globalBookmark'] = value as boolean;
            hadKey = false;
          }
          break;
        case 'score':
          comment.score = value as number;
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
          if (isNowAck === isModeration) {
            this.removeComment(payload.id, isModeration);
          }
          break;
        case 'tag':
          comment.tag = value as string;
          break;
        default:
          hadKey = false;
          break;
      }
      if (hadKey) {
        this.triggerUpdate({
          type: 'CommentPatched',
          subtype: key as keyof Comment,
          comment
        }, isModeration);
      }
    }
    this.triggerUpdate({
      type: 'CommentPatched',
      finished: true,
      updates,
      comment
    }, isModeration);
  }

  private onCommentHighlighted(payload: any, isModeration: boolean) {
    const data = isModeration ? this._fastNackCommentAccess[payload.id] : this._fastCommentAccess[payload.id];
    if (!data) {
      console.error('comment ' + payload.id + ' was not found!');
      return;
    }
    data.comment.highlighted = payload.lights as boolean;
    this.triggerUpdate({
      type: 'CommentHighlighted',
      finished: true,
      comment: data.comment
    }, isModeration);
  }

  private onCommentDeleted(payload: any, isModeration: boolean) {
    const data = isModeration ? this._fastNackCommentAccess[payload.id] : this._fastCommentAccess[payload.id];
    if (!data) {
      console.error('comment ' + payload.id + ' was not found!');
      return;
    }
    this.triggerUpdate({
      type: 'CommentDeleted',
      finished: false,
      comment: data.comment
    }, isModeration);
    this.removeComment(payload.id, isModeration);
  }

  private removeComment(id: string, isModeration: boolean) {
    const fastSource = isModeration ? this._fastNackCommentAccess : this._fastCommentAccess;
    const data = fastSource[id];
    data.comment.meta.removed = true;
    this.removeReference(data.comment, isModeration);
    const removeCommentFromSource = () => {
      const source = isModeration ? this._currentNackRoomComments : this._currentRoomComments;
      const index = source.getValue().findIndex(el => el.id === id);
      if (index >= 0) {
        source.getValue().splice(index, 1);
      } else {
        console.error('comment ' + id + ' was not found!');
      }
      fastSource[id] = undefined;
      this.triggerUpdate({
        type: 'CommentDeleted',
        finished: true,
        comment: data.comment
      }, isModeration);
    };
    setTimeout(removeCommentFromSource, 700);
  }

  private calculateCommentReferences(comments: CommentWithMeta[], isModeration: boolean) {
    const fastSource = isModeration ? this._fastNackCommentAccess : this._fastCommentAccess;
    for (const recieve of comments) {
      if (recieve.commentReference === null) {
        continue;
      }
      const parent = fastSource[recieve.commentReference]?.comment;
      if (!parent) {
        continue;
      }
      parent.meta.children.add(recieve.id);
      this.updateResponseCount(recieve, isModeration, true);
    }
  }

  private removeReference(comment: CommentWithMeta, isModeration: boolean) {
    if (comment.commentReference === null) {
      return;
    }
    const fastSource = isModeration ? this._fastNackCommentAccess : this._fastCommentAccess;
    const parent = fastSource[comment.commentReference]?.comment;
    if (!parent) {
      return;
    }
    this.updateResponseCount(comment, isModeration, false);
    parent.meta.children.delete(comment.id);
  }

  private updateResponseCount(comment: CommentWithMeta, isModeration: boolean, add: boolean) {
    if (comment.commentReference === null) {
      return;
    }
    const fastSource = isModeration ? this._fastNackCommentAccess : this._fastCommentAccess;
    let parent: CommentWithMeta;
    const count = comment.meta.responseCount + 1;
    const isStudent = this.sessionService.currentRoom.ownerId !== comment.creatorId &&
      this.sessionService.currentModerators.every(mod => mod.accountId !== comment.creatorId);
    const fromParticipants = comment.meta.responsesFromParticipants + (isStudent ? 1 : 0);
    while (comment.commentReference && (parent = fastSource[comment.commentReference]?.comment) && parent.meta.children.has(comment.id)) {
      parent.meta.responseCount += count * (add ? 1 : -1);
      parent.meta.responsesFromParticipants += fromParticipants * (add ? 1 : -1);
      comment = parent;
    }
  }
}


