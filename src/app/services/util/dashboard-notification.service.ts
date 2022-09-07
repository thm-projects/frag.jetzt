import { Injectable } from '@angular/core';
import { NotificationEvent } from '../../models/dashboard-notification';
import { CommentChange, CommentChangeRole, CommentChangeType } from '../../models/comment-change';
import { WsCommentChangeService } from '../websockets/ws-comment-change.service';
import {
  CommentChangeService,
  CommentChangeSubscription,
  RoomCommentChangeSubscription
} from '../http/comment-change.service';
import { UnloadService } from './unload.service';
import { Observable, Subscription, tap, throwError } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { filter } from 'rxjs/operators';
import { SessionService } from './session.service';
import { UserManagementService } from './user-management.service';

const loadNotifications = (): NotificationEvent[] => {
  const arr = JSON.parse(localStorage.getItem('dashboard-notifications') || '[]') as NotificationEvent[];
  arr.forEach(v => {
    v.createdAt = new Date(v.createdAt);
  });
  return arr;
};

interface IdSubscriptionMapper<T> {
  [key: string]: {
    subscription: Subscription;
    information: T;
  };
}

export enum DashboardFilter {
  QuestionPublished = 'QuestionPublished',
  QuestionMarkedWithStar = 'QuestionMarkedWithStar',
  CommentMarkedWithStar = 'CommentMarkedWithStar',
  QuestionAnswered = 'QuestionAnswered',
  QuestionAffirmed = 'QuestionAffirmed',
  QuestionNegated = 'QuestionNegated',
  QuestionCommented = 'QuestionCommented',
  QuestionBanned = 'QuestionBanned',
  QuestionDeleted = 'QuestionDeleted',
}

type DashboardFilterObject = { [key in DashboardFilter]: (events: NotificationEvent[]) => NotificationEvent[] };

@Injectable({
  providedIn: 'root'
})
export class DashboardNotificationService {

  public isNotificationBlocked: boolean = false;
  private _lastChanges = new Date(Number(localStorage.getItem('dashboard-notification-time')));
  private _lastUser = localStorage.getItem('dashboard-notification-user');
  private _notifications = loadNotifications();
  private _filteredNotifications: NotificationEvent[] = [];
  private _roomNotifications: NotificationEvent[] = [];
  private _commentSubscriptions: IdSubscriptionMapper<CommentChangeSubscription> = {};
  private _roomSubscriptions: IdSubscriptionMapper<RoomCommentChangeSubscription> = {};
  private _activeFilter: (notifications: NotificationEvent[]) => NotificationEvent[];
  private _activeFilterName: DashboardFilter;
  private _initialized = false;
  private readonly filterObject: DashboardFilterObject = {
    [DashboardFilter.CommentMarkedWithStar]: events =>
      events.filter(e => e.isAnswer && e.type === CommentChangeType.CHANGE_FAVORITE && e.currentValueString === '1'),
    [DashboardFilter.QuestionMarkedWithStar]: events =>
      events.filter(e => !e.isAnswer && e.type === CommentChangeType.CHANGE_FAVORITE && e.currentValueString === '1'),
    [DashboardFilter.QuestionAffirmed]: events =>
      events.filter(e => !e.isAnswer && e.type === CommentChangeType.CHANGE_CORRECT && e.currentValueString === '1'),
    [DashboardFilter.QuestionAnswered]: events =>
      events.filter(e => !e.isAnswer && e.type === CommentChangeType.ANSWERED &&
        [CommentChangeRole.CREATOR, CommentChangeRole.EXECUTIVE_MODERATOR, CommentChangeRole.EDITING_MODERATOR].includes(e.initiatorRole)),
    [DashboardFilter.QuestionBanned]: events =>
      events.filter(e => !e.isAnswer && e.type === CommentChangeType.CHANGE_ACK && e.currentValueString === '0'),
    [DashboardFilter.QuestionDeleted]: events =>
      events.filter(e => !e.isAnswer && e.type === CommentChangeType.DELETED),
    [DashboardFilter.QuestionCommented]: events =>
      events.filter(e => !e.isAnswer && e.type === CommentChangeType.ANSWERED &&
        [CommentChangeRole.PARTICIPANT].includes(e.initiatorRole)),
    [DashboardFilter.QuestionNegated]: events =>
      events.filter(e => !e.isAnswer && e.type === CommentChangeType.CHANGE_CORRECT && e.currentValueString === '2'),
    [DashboardFilter.QuestionPublished]: events =>
      events.filter(e => !e.isAnswer && e.type === CommentChangeType.CHANGE_ACK && e.currentValueString === '1'),
  };

  constructor(
    private wsCommentChangeService: WsCommentChangeService,
    private commentChangeService: CommentChangeService,
    private unloadService: UnloadService,
    private userManagementService: UserManagementService,
    private sessionService: SessionService,
  ) {
    unloadService.onUnload().subscribe(() => {
      localStorage.setItem('dashboard-notification-time', String(this._lastChanges.getTime()));
      localStorage.setItem('dashboard-notification-user', this.userManagementService.getCurrentUser()?.id);
      localStorage.setItem('dashboard-notifications', JSON.stringify(this._notifications));
    });
    this.userManagementService.getUser().pipe(filter(v => !!v)).subscribe(user => {
      if (user.id === this._lastUser) {
        if (!this._initialized) {
          this.setup();
        }
        return;
      }
      this._lastUser = user.id;
      this.cleanup();
      this.setup();
    });
    this.sessionService.getRoom().subscribe(room => {
      this._roomNotifications.length = 0;
      this._roomNotifications.push(...this._notifications.filter(n => n.roomId === room?.id));
      this._activeFilter = null;
    });
  }

  hasCommentSubscription(commentId: string) {
    return Boolean(this._commentSubscriptions[commentId]);
  }

  hasRoomSubscription(roomId: string) {
    return Boolean(this._roomSubscriptions[roomId]);
  }

  addRoomSubscription(roomId: string): Observable<RoomCommentChangeSubscription> {
    if (this.hasRoomSubscription(roomId)) {
      return throwError(() => new Error('Already subscribed or currently subscribing!'));
    }
    this._roomSubscriptions[roomId] = {
      subscription: this.wsCommentChangeService.getRoomStream(roomId)
        .subscribe(this.pushNotification.bind(this)),
      information: null
    };
    return this.commentChangeService.createRoomSubscription(roomId).pipe(
      tap({
        next: info => this._roomSubscriptions[roomId].information = info,
        error: () => this._roomSubscriptions[roomId].information = { roomId, accountId: null, id: null },
      })
    );
  }

  deleteRoomSubscription(roomId: string): Observable<any> {
    const data = this._roomSubscriptions[roomId];
    if (!data) {
      return throwError(() => new Error('No active subscription!'));
    }
    if (!data.information) {
      return throwError(() => new Error('Not activated yet'));
    }
    this._roomSubscriptions[roomId] = undefined;
    data.subscription.unsubscribe();
    return this.commentChangeService.deleteRoomSubscription(roomId);
  }

  addCommentSubscription(roomId: string, commentId: string): Observable<CommentChangeSubscription> {
    if (this.hasCommentSubscription(commentId)) {
      return throwError(() => new Error('Already subscribed or currently subscribing!'));
    }
    this._commentSubscriptions[commentId] = {
      subscription: this.wsCommentChangeService.getCommentStream(roomId, commentId)
        .subscribe(this.pushNotification.bind(this)),
      information: null
    };
    return this.commentChangeService.createCommentSubscription(commentId).pipe(
      tap({
        next: info => this._commentSubscriptions[commentId].information = info,
        error: () => this._commentSubscriptions[commentId].information = {
          commentId,
          roomId,
          accountId: null,
          id: null
        },
      })
    );
  }

  deleteCommentSubscription(commentId: string): Observable<any> {
    const data = this._commentSubscriptions[commentId];
    if (!data) {
      return throwError(() => new Error('No active comment subscription!'));
    }
    if (!data.information) {
      return throwError(() => new Error('Not activated yet'));
    }
    this._commentSubscriptions[commentId] = undefined;
    data.subscription.unsubscribe();
    return this.commentChangeService.deleteCommentSubscription(commentId);
  }

  deleteAll() {
    this._notifications.length = 0;
    this._roomNotifications.length = 0;
    this._filteredNotifications.length = 0;
  }

  getList(filteredData = false): NotificationEvent[] {
    if (filteredData) {
      return this._filteredNotifications;
    }
    return this._roomNotifications;
  }

  getActiveFilter(): DashboardFilter {
    return this._activeFilterName;
  }

  reset() {
    this._filteredNotifications.length = 0;
    this._activeFilterName = null;
    this._activeFilter = null;
  }

  filterNotifications(type: DashboardFilter) {
    this._filteredNotifications.length = 0;
    if (!DashboardFilter[type]) {
      throw new Error('invalid filter argument');
    }
    this._activeFilterName = type;
    this._activeFilter = this.filterObject[type];
    this._filteredNotifications.push(...this._activeFilter(this.getList()));
  }

  deleteElement(filtered: boolean, index: number) {
    const elements = [this.getList(), this._filteredNotifications];
    if (filtered) {
      elements.reverse();
    }
    if (index < 0 || index >= elements[0].length) {
      throw new Error('error in deleteFiltered(): invalid index argument');
    }
    const deleted = elements[0].splice(index, 1)[0];
    const secondIndex = elements[1].indexOf(deleted);
    if (secondIndex >= 0) {
      elements[1].splice(secondIndex, 1);
    }
  }

  private pushNotification(message: IMessage) {
    if (this.isNotificationBlocked) {
      return;
    }
    const commentChange = JSON.parse(message.body).payload;
    commentChange.createdAt = new Date(commentChange.createdAt);
    this.pushCommentChange(commentChange);
  }

  private pushCommentChange(commentChange: CommentChange): void {
    if (this.isNotificationBlocked) {
      return;
    }
    const accountId = this.userManagementService.getCurrentUser()?.id;
    const notification: NotificationEvent = {
      ...commentChange,
      fromSelf: accountId === commentChange.initiatorId,
      ownsComment: accountId === commentChange.commentCreatorId,
    };
    this._notifications.unshift(notification);
    if (commentChange.createdAt > this._lastChanges) {
      this._lastChanges = commentChange.createdAt;
    }
    if (this.sessionService.currentRoom?.id !== notification.roomId) {
      return;
    }
    this._roomNotifications.unshift(notification);
    if (this._activeFilter) {
      this._filteredNotifications.unshift(...this._activeFilter([notification]));
    }
  }

  private cleanup() {
    for (const key of Object.keys(this._roomSubscriptions)) {
      const subObject = this._roomSubscriptions[key];
      subObject.subscription.unsubscribe();
      this._roomSubscriptions[key] = undefined;
    }
    for (const key of Object.keys(this._commentSubscriptions)) {
      const subObject = this._commentSubscriptions[key];
      subObject.subscription.unsubscribe();
      this._commentSubscriptions[key] = undefined;
    }
    this._notifications.length = 0;
    this._filteredNotifications.length = 0;
    this._lastChanges = new Date(0);
  }

  private setup() {
    this._initialized = true;
    this.commentChangeService.findAllChangesSince(this._lastChanges).subscribe(changes => {
      changes.forEach(change => {
        change.createdAt = new Date(change.createdAt);
      });
      changes = changes.filter(change => change.createdAt.getTime() > this._lastChanges.getTime());
      changes.sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
      changes.forEach(change => this.pushCommentChange(change));
    });
    this.commentChangeService.getRoomSubscriptions().subscribe(subscriptions => {
      subscriptions.forEach(subscription => {
        this._roomSubscriptions[subscription.roomId] = {
          subscription: this.wsCommentChangeService.getRoomStream(subscription.roomId)
            .subscribe(this.pushNotification.bind(this)),
          information: subscription
        };
      });
    });
    this.commentChangeService.getCommentSubscriptions().subscribe(subscriptions => {
      subscriptions.forEach(subscription => {
        this._commentSubscriptions[subscription.commentId] = {
          subscription: this.wsCommentChangeService.getCommentStream(subscription.roomId, subscription.commentId)
            .subscribe(this.pushNotification.bind(this)),
          information: subscription
        };
      });
    });
  }
}
