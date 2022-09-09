import { Comment } from '../models/comment';
import { CommentProfanityInformation, RoomDataProfanityFilter } from '../services/util/room-data.profanity-filter';
import { UserRole } from '../models/user-roles.enum';
import { CommentService } from '../services/http/comment.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { BookmarkAccess, RoomDataService } from '../services/util/room-data.service';
import { QuillUtils, SerializedDelta } from './quill-utils';

export interface ForumData {
  children: Set<ForumComment>;
  totalAnswerFromParticipantCount: number;
  totalAnswerCount: number;
}

export interface ForumComment extends Comment, ForumData {
  removed: boolean;
  created: boolean;
  globalBookmark?: boolean;
}

interface FastAccess {
  [key: string]: CommentProfanityInformation;
}

export interface CommentCreatedInformation {
  type: 'CommentCreated';
  comment: ForumComment;
  finished: true;
}

export interface CommentPatchedKeyInformation {
  type: 'CommentPatched';
  comment: ForumComment;
  subtype: (keyof Comment);
  finished: false;
}

export interface CommentPatchedEndInformation {
  type: 'CommentPatched';
  comment: ForumComment;
  updates: (keyof Comment)[];
  finished: true;
}

export interface CommentHighlightedInformation {
  type: 'CommentHighlighted';
  comment: ForumComment;
  finished: true;
}

export interface CommentDeletedInformation {
  type: 'CommentDeleted';
  comment: ForumComment;
  finished: false | true;
}

export type UpdateInformation =
  CommentCreatedInformation
  | CommentPatchedKeyInformation
  | CommentPatchedEndInformation
  | CommentHighlightedInformation
  | CommentDeletedInformation;

class DataAccessorUpdateSubscription {
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

// DataAccessor Specific
const SIMPLE_PATCH_PROPERTIES: Set<keyof Comment> = new Set([
  'read', 'correct', 'favorite', 'score', 'upvotes', 'downvotes', 'tag'
]);

export class DataAccessor {

  // Properties
  readonly isAcknowledged: boolean;
  private _fastAccess: FastAccess;
  private _rawComments: BehaviorSubject<ForumComment[]>;
  private _forumComments: BehaviorSubject<ForumComment[]>;
  private _wasReset: boolean;
  private _messageQueue: any[] = [];
  private _currentSubscriptions: DataAccessorUpdateSubscription[] = [];
  // Room specific
  private _moderatorIds: Set<string>;
  private _ownerId: string;
  private _currentRole: UserRole;
  private _userBookmarks: BookmarkAccess;
  private _filter: RoomDataProfanityFilter;

  constructor(
    private parent: RoomDataService,
    acknowledged: boolean,
    private commentService: CommentService,
  ) {
    this.isAcknowledged = acknowledged;
    this.reset();
  }

  getDataById(commentId: string): CommentProfanityInformation {
    return this._fastAccess[commentId];
  }

  receiveUpdates(updateFilter: Partial<UpdateInformation>[]): Observable<UpdateInformation> {
    const subscription = new DataAccessorUpdateSubscription(updateFilter);
    this._currentSubscriptions.push(subscription);
    return subscription.updateSubject.asObservable();
  }

  getRawComments(frozen: boolean): Observable<ForumComment[]> {
    return this.generateCommentObservable(true, frozen);
  }

  currentRawComments(): Readonly<ForumComment[]> {
    return this._rawComments.value;
  }

  getForumComments(frozen: boolean): Observable<ForumComment[]> {
    return this.generateCommentObservable(false, frozen);
  }

  currentForumComments(): Readonly<ForumComment[]> {
    return this._forumComments.value;
  }

  updateCurrentRole(role: UserRole) {
    const changedBookmark = (role === UserRole.PARTICIPANT) !== (this._currentRole === UserRole.PARTICIPANT);
    this._currentRole = role;
    if (!changedBookmark) {
      return;
    }
    if (this._currentRole === UserRole.PARTICIPANT) {
      for (const commentId of Object.keys(this._fastAccess)) {
        const comment = this._fastAccess[commentId].comment;
        comment.globalBookmark = comment.bookmark;
        comment.bookmark = Boolean(this._userBookmarks[commentId]);
      }
    } else {
      for (const commentId of Object.keys(this._fastAccess)) {
        const comment = this._fastAccess[commentId].comment;
        comment.bookmark = comment.globalBookmark;
      }
    }
  }

  pushNewRoomComments(
    comments: Comment[],
    profanityFilter: RoomDataProfanityFilter,
    moderatorIds: Set<string>,
    ownerId: string,
    currentRole: UserRole,
    userBookmarks: BookmarkAccess,
  ) {
    if (!this._wasReset) {
      console.error('Accessor already initialized!');
      return;
    }
    this._moderatorIds = moderatorIds;
    this._ownerId = ownerId;
    this._currentRole = currentRole;
    this._userBookmarks = userBookmarks;
    this._filter = profanityFilter;
    // migrate comments
    const forumComments: ForumComment[] = comments.map(c => ({
      ...c,
      created: false,
      removed: false,
      children: new Set<ForumComment>(),
      totalAnswerFromParticipantCount: 0,
      totalAnswerCount: 0,
    }));
    // apply profanity filtering and register in cache
    for (const comment of forumComments) {
      this._fastAccess[comment.id] = profanityFilter.filterComment(comment);
    }
    // calculate references
    forumComments.forEach(c => this.updateAnswerCounts(c, true));
    // update bookmarks
    if (this._currentRole === UserRole.PARTICIPANT) {
      forumComments.forEach(c => {
        c.globalBookmark = c.bookmark;
        c.bookmark = Boolean(this._userBookmarks[c.id]);
      });
    }
    this._rawComments.next(forumComments);
    this._forumComments.next(forumComments.filter(c => !Boolean(c.commentReference)));
    // apply missed messages
    this._messageQueue.forEach(msg => this.onMessageReceive(msg));
    this._messageQueue.length = 0;
    this._wasReset = false;
    this._rawComments.next(this._rawComments.value);
    this._forumComments.next(this._forumComments.value);
  }

  reset(): void {
    this._wasReset = true;
    this._rawComments?.complete();
    this._rawComments = new BehaviorSubject<ForumComment[]>([]);
    this._forumComments?.complete();
    this._forumComments = new BehaviorSubject<ForumComment[]>([]);
    this._currentSubscriptions.forEach(sub => sub.updateSubject.complete());
    this._currentSubscriptions.length = 0;
    this._fastAccess = {};
    this._messageQueue.length = 0;
    this._moderatorIds = null;
    this._ownerId = null;
    this._currentRole = null;
    this._userBookmarks = null;
  }

  receiveMessage(message: any) {
    if (this._wasReset) {
      this._messageQueue.push(message);
      return;
    }
    this.onMessageReceive(message);
  }

  removeCommentFully(id: string) {
    if (this._wasReset) {
      throw new Error('Accessor not initialized!');
    }
    const comment = this._fastAccess[id]?.comment;
    if (comment === undefined) {
      console.error('Delete: Comment ' + id + ' was not found!');
      return;
    }
    this.updateAnswerCounts(comment, false);
    this._fastAccess[id] = undefined;
    const remover = (source: BehaviorSubject<ForumComment[]>) => {
      const index = source.value.indexOf(comment);
      if (index >= 0) {
        source.value.splice(index, 1);
        source.next(source.value);
      }
    };
    remover(this._rawComments);
    remover(this._forumComments);
    this.triggerUpdate({
      type: 'CommentDeleted',
      finished: true,
      comment,
    });
  }

  updateProfanityFiltering() {
    this._rawComments.value.forEach(comment => {
      const data = this._fastAccess[comment.id];
      const wasDefault = data.hasProfanity === data.filtered;
      if (data.filtered) {
        RoomDataProfanityFilter.applyToComment(data.comment, data.beforeFiltering);
      }
      this._fastAccess[comment.id] = this._filter.filterComment(comment, wasDefault);
    });
  }

  private generateCommentObservable(forRaw: boolean, frozen: boolean) {
    return new Observable<ForumComment[]>(subscriber => {
      const subscription = (forRaw ? this._rawComments : this._forumComments)
        .pipe(
          filter(() => !this._wasReset),
          take(frozen ? 1 : Number.POSITIVE_INFINITY),
        )
        .subscribe({
          next: value => {
            const data = value;
            subscriber.next(frozen ? [...data] : data);
          },
          error: err => {
            subscriber.error(err);
          },
          complete: () => {
            subscriber.complete();
          }
        });
      return () => {
        setTimeout(() => subscription.unsubscribe());
      };
    });
  }

  private onMessageReceive(data: any) {
    switch (data.type) {
      case 'CommentCreated':
        this.onCommentCreate(data.payload);
        break;
      case 'CommentPatched':
        this.onCommentPatched(data.payload);
        break;
      case 'CommentHighlighted':
        this.onCommentHighlighted(data.payload);
        break;
      case 'CommentDeleted':
        this.removeComment(data.payload.id);
        break;
    }
  }

  private onCommentCreate(payload: any) {
    this.commentService.getComment(payload.id).subscribe(comment => {
      const forumComment: ForumComment = {
        ...comment,
        created: true,
        removed: false,
        children: new Set<ForumComment>(),
        totalAnswerFromParticipantCount: 0,
        totalAnswerCount: 0,
      };
      // apply profanity filtering and register in cache
      this._fastAccess[forumComment.id] = this._filter.filterComment(forumComment);
      // calculate references
      this.updateAnswerCounts(forumComment, true);
      // update bookmarks
      if (this._currentRole === UserRole.PARTICIPANT) {
        forumComment.globalBookmark = forumComment.bookmark;
        forumComment.bookmark = Boolean(this._userBookmarks[forumComment.id]);
      }
      this._rawComments.value.push(forumComment);
      this._rawComments.next(this._rawComments.value);
      if (!Boolean(forumComment.commentReference)) {
        this._forumComments.value.push(forumComment);
        this._forumComments.next(this._forumComments.value);
      }
      this.triggerUpdate({
        type: 'CommentCreated',
        finished: true,
        comment: forumComment
      });
    });
  }

  private onCommentPatched(payload: any) {
    const comment = this._fastAccess[payload.id]?.comment;
    if (comment === undefined) {
      console.error('Patch: Comment ' + payload.id + ' was not found!');
      return;
    }
    const updates: (keyof Comment)[] = [];
    for (const [key, value] of Object.entries(payload.changes)) {
      const changeKey = key as keyof Comment;
      if (this.patchCommentValue(changeKey, comment, value)) {
        updates.push(changeKey);
        this.triggerUpdate({
          type: 'CommentPatched',
          subtype: changeKey,
          comment,
          finished: false,
        });
      }
    }
    this.triggerUpdate({
      type: 'CommentPatched',
      finished: true,
      updates,
      comment
    });
  }

  private patchCommentValue(changeKey: keyof Comment, comment: ForumComment, value: any) {
    let hadKey = true;
    switch (changeKey) {
      case 'bookmark':
        if (this._currentRole !== UserRole.PARTICIPANT) {
          comment.bookmark = value as boolean;
        } else {
          comment.globalBookmark = value as boolean;
          hadKey = false;
        }
        break;
      case 'keywordsFromSpacy':
      case 'keywordsFromQuestioner':
        comment[changeKey] = JSON.parse(value as string);
        break;
      case 'ack':
        const isNowAck = value as boolean;
        comment.ack = isNowAck;
        if (isNowAck !== this.isAcknowledged) {
          this.removeComment(comment.id);
        }
        break;
      case 'body':
        comment.body = QuillUtils.deserializeDelta(value as SerializedDelta);
        break;
      default:
        if (SIMPLE_PATCH_PROPERTIES.has(changeKey)) {
          // @ts-ignore
          comment[changeKey] = value;
        } else {
          console.error('Unknown comment patch: ' + changeKey);
          hadKey = false;
        }
        break;
    }
    return hadKey;
  }

  private onCommentHighlighted(payload: any) {
    const comment = this._fastAccess[payload.id]?.comment;
    if (comment === undefined) {
      console.error('Highlighted: Comment ' + payload.id + ' was not found!');
      return;
    }
    comment.highlighted = payload.lights as boolean;
    this.triggerUpdate({
      type: 'CommentHighlighted',
      finished: true,
      comment,
    });
  }

  private removeComment(id: string) {
    const comment = this._fastAccess[id]?.comment;
    if (comment === undefined) {
      console.error('Mark deleted: Comment ' + id + ' was not found!');
      return;
    }
    comment.removed = true;
    this.triggerUpdate({
      type: 'CommentDeleted',
      finished: false,
      comment,
    });
    if (this.parent.isRegistered(id)) {
      this.parent.onUnregister(id).subscribe(commentId => {
        this.removeCommentFully(commentId);
      });
    } else {
      this.removeCommentFully(id);
    }
  }

  private updateAnswerCounts(comment: ForumComment, add: boolean) {
    const startComment = comment;
    const startParent = this._fastAccess[comment.commentReference]?.comment;
    if (startParent === undefined) {
      return;
    }
    if (add) {
      startParent.children.add(startComment);
    }
    const factor = add ? 1 : -1;
    const answerDiff = (comment.totalAnswerCount + 1) * factor;
    const isStudent = this._ownerId !== comment.creatorId && !this._moderatorIds.has(comment.creatorId);
    const answerParticipantDiff = (comment.totalAnswerFromParticipantCount + Number(isStudent)) * factor;
    let parent: ForumComment;
    while ((parent = this._fastAccess[comment.commentReference]?.comment) !== undefined && parent.children.has(comment)) {
      parent.totalAnswerCount += answerDiff;
      parent.totalAnswerFromParticipantCount += answerParticipantDiff;
      comment = parent;
    }
    if (!add) {
      startParent.children.delete(startComment);
    }
  }

  private triggerUpdate(updateInfo: UpdateInformation): void {
    this._currentSubscriptions.forEach(sub => sub.onUpdate(updateInfo));
  }
}
