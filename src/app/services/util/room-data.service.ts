import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  forkJoin,
  Observable,
  Subject,
  takeUntil,
} from 'rxjs';
import { WsCommentService } from '../websockets/ws-comment.service';
import { Comment } from '../../models/comment';
import { CommentService } from '../http/comment.service';
import { ProfanityFilterService } from './profanity-filter.service';
import { Room } from '../../models/room';
import { SessionService } from './session.service';
import { UserRole } from '../../models/user-roles.enum';
import {
  CommentFilterData,
  RoomDataProfanityFilter,
} from './room-data.profanity-filter';
import { ActiveUserService } from '../http/active-user.service';
import { BookmarkService } from '../http/bookmark.service';
import { Bookmark } from '../../models/bookmark';
import { DataAccessor, ForumComment } from '../../utils/data-accessor';
import { filter, take } from 'rxjs/operators';
import { AccountStateService } from '../state/account-state.service';
import { RoomStateService } from '../state/room-state.service';

export interface BookmarkAccess {
  [commentId: string]: Bookmark;
}

@Injectable({
  providedIn: 'root',
})
export class RoomDataService {
  public readonly dataAccessor: DataAccessor;
  public readonly moderatorDataAccessor: DataAccessor;
  private _canAccessModerator = false;
  private _currentUserCount = new BehaviorSubject<string>('?');
  private _userBookmarks: BookmarkAccess = {};
  private _destroyer: Subject<any>;
  private _commentUIRegistrations = new Map<string, Set<any>>();
  private _commentUISubscriber: Subject<string>;

  constructor(
    private wsCommentService: WsCommentService,
    private commentService: CommentService,
    public readonly sessionService: SessionService,
    private profanityFilterService: ProfanityFilterService,
    private accountState: AccountStateService,
    private activeUserService: ActiveUserService,
    private bookmarkService: BookmarkService,
    private roomState: RoomStateService,
  ) {
    this.dataAccessor = new DataAccessor(this, true, commentService);
    this.moderatorDataAccessor = new DataAccessor(this, false, commentService);
    let lastRoom = null;
    this.sessionService.getRoom().subscribe((room) => {
      lastRoom = room;
      this.onRoomUpdate(room);
    });
    this.accountState.user$.subscribe((_) => this.onRoomUpdate(lastRoom));
    this.sessionService.getRole().subscribe((role) => {
      this.dataAccessor.updateCurrentRole(role);
      this.moderatorDataAccessor.updateCurrentRole(role);
    });
  }

  get canAccessModerator() {
    return this._canAccessModerator;
  }

  observeUserCount(): Observable<string> {
    return this._currentUserCount.asObservable();
  }

  applyStateToComment(
    comment: Comment,
    beforeFilter: boolean,
    isModeration = false,
  ) {
    const source = isModeration
      ? this.moderatorDataAccessor.getDataById(comment.id)
      : this.dataAccessor.getDataById(comment.id);
    const data = beforeFilter ? source.beforeFiltering : source.afterFiltering;
    RoomDataProfanityFilter.applyToComment(comment as ForumComment, data);
    source.filtered = !beforeFilter;
  }

  isCommentProfane(comment: Comment, isModeration = false): boolean {
    const source = isModeration
      ? this.moderatorDataAccessor.getDataById(comment.id)
      : this.dataAccessor.getDataById(comment.id);
    return source?.hasProfanity;
  }

  checkCommentProfanity(comment: Comment): boolean {
    const id = comment.id;
    return Boolean(
      (
        this.dataAccessor.getDataById(id) ||
        this.moderatorDataAccessor.getDataById(id)
      )?.hasProfanity,
    );
  }

  isCommentCensored(comment: Comment, isModeration = false): boolean {
    const source = isModeration
      ? this.moderatorDataAccessor.getDataById(comment.id)
      : this.dataAccessor.getDataById(comment.id);
    return source?.filtered;
  }

  getCensoredInformation(
    comment: Comment,
    isModeration = false,
  ): CommentFilterData {
    const source = isModeration
      ? this.moderatorDataAccessor.getDataById(comment.id)
      : this.dataAccessor.getDataById(comment.id);
    return source?.afterFiltering;
  }

  getCommentReference(id: string): ForumComment {
    return (
      this.dataAccessor.getDataById(id) ||
      this.moderatorDataAccessor.getDataById(id)
    )?.comment;
  }

  toggleBookmark(comment: Comment) {
    comment.bookmark = !comment.bookmark;
    if (comment.bookmark) {
      this.bookmarkService.create({ commentId: comment.id }).subscribe({
        next: (bookmark) => (this._userBookmarks[comment.id] = bookmark),
        error: (_) => (comment.bookmark = !comment.bookmark),
      });
      return;
    }
    const id = this._userBookmarks[comment.id]?.id;
    if (!id) {
      return;
    }
    this.bookmarkService.delete(id).subscribe({
      next: (_) => (this._userBookmarks[comment.id] = undefined),
      error: (_) => (comment.bookmark = !comment.bookmark),
    });
  }

  registerUI(commentId: string, object: any) {
    if (!this._commentUISubscriber) {
      throw new Error('Registration error: not initialized');
    }
    let prev = this._commentUIRegistrations.get(commentId);
    if (!prev) {
      prev = new Set();
      this._commentUIRegistrations.set(commentId, prev);
    }
    prev.add(object);
  }

  unregisterUI(commentId: string, object: any) {
    if (!this._commentUISubscriber) {
      return;
    }
    const prev = this._commentUIRegistrations.get(commentId);
    if (!prev) {
      return;
    }
    prev.delete(object);
    if (prev.size === 0) {
      this._commentUISubscriber.next(commentId);
    }
  }

  isRegistered(commentId: string) {
    return Boolean(this._commentUIRegistrations.get(commentId));
  }

  onUnregister(commentId: string): Observable<string> {
    return this._commentUISubscriber.pipe(
      filter((v) => v === commentId),
      take(1),
    );
  }

  private onRoomUpdate(room: Room) {
    this.clear();
    if (!room) {
      return;
    }
    this._destroyer = new Subject<any>();
    const currentDestroyer = this._destroyer;
    this._commentUISubscriber = new Subject();
    this.activeUserService
      .getActiveUser(room)
      .pipe(takeUntil(currentDestroyer))
      .subscribe(([count]) => this._currentUserCount.next(String(count || 0)));
    const userRole = this.roomState.getCurrentRole() || UserRole.PARTICIPANT;
    this._canAccessModerator = userRole > UserRole.PARTICIPANT;
    this.wsCommentService
      .getCommentStream(room.id, userRole)
      .pipe(takeUntil(currentDestroyer))
      .subscribe((message) => {
        const msg = JSON.parse(message.body);
        const payload = msg.payload;
        if (!payload) {
          this._currentUserCount.next(
            String(msg['UserCountChanged'].userCount),
          );
          return;
        }
        this.dataAccessor.receiveMessage(msg);
      });
    if (this._canAccessModerator) {
      this.wsCommentService
        .getModeratorCommentStream(room.id)
        .pipe(takeUntil(currentDestroyer))
        .subscribe((message) => {
          const msg = JSON.parse(message.body);
          const payload = msg.payload;
          if (!payload) {
            this._currentUserCount.next(
              String(msg['UserCountChanged'].userCount),
            );
            return;
          }
          this.moderatorDataAccessor.receiveMessage(msg);
        });
    }
    const profanityFilter = new RoomDataProfanityFilter(
      this.profanityFilterService,
      room,
    );
    forkJoin([
      this.bookmarkService.getByRoomId(this.sessionService.currentRoom.id),
      this.sessionService.getModeratorsOnce(),
    ]).subscribe(([bookmarks, moderators]) => {
      bookmarks.forEach((b) => (this._userBookmarks[b.commentId] = b));
      const moderatorIds = new Set(moderators.map((m) => m.accountId));
      this.commentService
        .getAckComments(room.id)
        .pipe(takeUntil(currentDestroyer))
        .subscribe((comments) => {
          this.dataAccessor.pushNewRoomComments(
            comments,
            profanityFilter,
            moderatorIds,
            room.ownerId,
            userRole,
            this._userBookmarks,
          );
        });
      this.commentService
        .getRejectedComments(room.id)
        .pipe(takeUntil(currentDestroyer))
        .subscribe((comments) => {
          this.moderatorDataAccessor.pushNewRoomComments(
            comments,
            profanityFilter,
            moderatorIds,
            room.ownerId,
            userRole,
            this._userBookmarks,
          );
        });
    });
    let hasChanges = false;
    this.sessionService
      .receiveRoomUpdates(true)
      .pipe(takeUntil(currentDestroyer))
      .subscribe((r) => {
        hasChanges = Object.keys(r).includes('profanityFilter');
      });
    this.sessionService
      .receiveRoomUpdates()
      .pipe(takeUntil(currentDestroyer))
      .subscribe(() => {
        if (hasChanges) {
          hasChanges = false;
          this.dataAccessor.updateProfanityFiltering();
          if (this._canAccessModerator) {
            this.moderatorDataAccessor.updateProfanityFiltering();
          }
        }
      });
  }

  private clear() {
    this._currentUserCount.next('?');
    this._userBookmarks = {};
    if (this._commentUISubscriber) {
      this._commentUIRegistrations.forEach((registrations, commentId) => {
        if (registrations.size > 1) {
          this._commentUISubscriber.next(commentId);
        }
      });
      this._commentUISubscriber.complete();
    }
    this._commentUIRegistrations.clear();
    this._commentUISubscriber = null;
    this.dataAccessor.reset();
    this.moderatorDataAccessor.reset();
    this._destroyer?.next(true);
    this._destroyer?.complete();
    this._destroyer = null;
  }
}
