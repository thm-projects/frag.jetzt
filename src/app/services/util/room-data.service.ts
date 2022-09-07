import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, Subject, takeUntil } from 'rxjs';
import { WsCommentService } from '../websockets/ws-comment.service';
import { Comment } from '../../models/comment';
import { CommentService } from '../http/comment.service';
import { ProfanityFilterService } from './profanity-filter.service';
import { Room } from '../../models/room';
import { SessionService } from './session.service';
import { UserRole } from '../../models/user-roles.enum';
import { CommentFilterData, RoomDataProfanityFilter } from './room-data.profanity-filter';
import { ActiveUserService } from '../http/active-user.service';
import { BookmarkService } from '../http/bookmark.service';
import { Bookmark } from '../../models/bookmark';
import { DataAccessor, ForumComment } from '../../utils/data-accessor';
import { UserManagementService } from './user-management.service';

export interface BookmarkAccess {
  [commentId: string]: Bookmark;
}

@Injectable({
  providedIn: 'root'
})
export class RoomDataService {

  public readonly dataAccessor: DataAccessor;
  public readonly moderatorDataAccessor: DataAccessor;
  private _canAccessModerator = false;
  private _currentUserCount = new BehaviorSubject<string>('?');
  private _userBookmarks: BookmarkAccess = {};
  private _destroyer: Subject<any>;

  constructor(
    private wsCommentService: WsCommentService,
    private commentService: CommentService,
    public readonly sessionService: SessionService,
    private profanityFilterService: ProfanityFilterService,
    private userManagementService: UserManagementService,
    private activeUserService: ActiveUserService,
    private bookmarkService: BookmarkService,
  ) {
    this.dataAccessor = new DataAccessor(true, commentService);
    this.moderatorDataAccessor = new DataAccessor(false, commentService);
    let lastRoom = null;
    this.sessionService.getRoom().subscribe(room => {
      lastRoom = room;
      this.onRoomUpdate(room);
    });
    this.userManagementService.getUser().subscribe(_ => this.onRoomUpdate(lastRoom));
    this.sessionService.getRole().subscribe(role => {
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

  applyStateToComment(comment: Comment, beforeFilter: boolean, isModeration = false) {
    const source = isModeration ? this.moderatorDataAccessor.getDataById(comment.id) : this.dataAccessor.getDataById(comment.id);
    const data = beforeFilter ? source.beforeFiltering : source.afterFiltering;
    RoomDataProfanityFilter.applyToComment(comment as ForumComment, data);
    source.filtered = !beforeFilter;
  }

  isCommentProfane(comment: Comment, isModeration = false): boolean {
    const source = isModeration ? this.moderatorDataAccessor.getDataById(comment.id) : this.dataAccessor.getDataById(comment.id);
    return source.hasProfanity;
  }

  checkCommentProfanity(comment: Comment): boolean {
    const id = comment.id;
    return Boolean((this.dataAccessor.getDataById(id) || this.moderatorDataAccessor.getDataById(id))?.hasProfanity);
  }

  isCommentCensored(comment: Comment, isModeration = false): boolean {
    const source = isModeration ? this.moderatorDataAccessor.getDataById(comment.id) : this.dataAccessor.getDataById(comment.id);
    return source.filtered;
  }

  getCensoredInformation(comment: Comment, isModeration = false): CommentFilterData {
    const source = isModeration ? this.moderatorDataAccessor.getDataById(comment.id) : this.dataAccessor.getDataById(comment.id);
    return source?.afterFiltering;
  }

  getCommentReference(id: string): ForumComment {
    return (this.dataAccessor.getDataById(id) || this.moderatorDataAccessor.getDataById(id))?.comment;
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

  private onRoomUpdate(room: Room) {
    this._currentUserCount.next('?');
    this._userBookmarks = {};
    this.dataAccessor.reset();
    this.moderatorDataAccessor.reset();
    this._destroyer?.next(true);
    this._destroyer?.complete();
    this._destroyer = null;
    if (!room) {
      return;
    }
    this._destroyer = new Subject<any>();
    this.activeUserService.getActiveUser(room)
      .pipe(takeUntil(this._destroyer))
      .subscribe(([count]) => this._currentUserCount.next(String(count || 0)));
    const userRole = this.userManagementService.getCurrentUser()?.role || UserRole.PARTICIPANT;
    this._canAccessModerator = userRole > UserRole.PARTICIPANT;
    this.wsCommentService.getCommentStream(room.id).pipe(takeUntil(this._destroyer)).subscribe(message => {
      const msg = JSON.parse(message.body);
      const payload = msg.payload;
      if (!payload) {
        this._currentUserCount.next(String(msg['UserCountChanged'].userCount));
        return;
      }
      this.dataAccessor.receiveMessage(msg);
    });
    if (this._canAccessModerator) {
      this.wsCommentService.getModeratorCommentStream(room.id).pipe(takeUntil(this._destroyer)).subscribe(message => {
        const msg = JSON.parse(message.body);
        const payload = msg.payload;
        if (!payload) {
          this._currentUserCount.next(String(msg['UserCountChanged'].userCount));
          return;
        }
        this.moderatorDataAccessor.receiveMessage(msg);
      });
    }
    const filter = new RoomDataProfanityFilter(this.profanityFilterService, room);
    forkJoin([
      this.bookmarkService.getByRoomId(this.sessionService.currentRoom.id),
      this.sessionService.getModeratorsOnce(),
    ]).subscribe(([bookmarks, moderators]) => {
      bookmarks.forEach(b => this._userBookmarks[b.commentId] = b);
      const moderatorIds = new Set(moderators.map(m => m.accountId));
      this.commentService.getAckComments(room.id).pipe(takeUntil(this._destroyer)).subscribe(comments => {
        this.dataAccessor.pushNewRoomComments(comments, filter, moderatorIds, room.ownerId, userRole, this._userBookmarks);
      });
      this.commentService.getRejectedComments(room.id).pipe(takeUntil(this._destroyer)).subscribe(comments => {
        this.moderatorDataAccessor.pushNewRoomComments(comments, filter, moderatorIds, room.ownerId, userRole, this._userBookmarks);
      });
    });
    let hasChanges = false;
    this.sessionService.receiveRoomUpdates(true)
      .pipe(takeUntil(this._destroyer))
      .subscribe(r => {
        hasChanges = Object.keys(r).includes('profanityFilter');
      });
    this.sessionService.receiveRoomUpdates()
      .pipe(takeUntil(this._destroyer))
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
}


