import { Injectable } from '@angular/core';
import { NotificationEvent } from '../../models/dashboard-notification';
import { CommentChange, CommentChangeType } from '../../models/comment-change';
import { WsCommentChangeService } from '../websockets/ws-comment-change.service';
import {
  CommentChangeService,
  CommentChangeSubscription,
  RoomCommentChangeSubscription
} from '../http/comment-change.service';
import { UnloadService } from './unload.service';
import { Observable, Subscription, tap, throwError } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { AuthenticationService } from '../http/authentication.service';
import { filter } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class DashboardNotificationService {

  public isNotificationBlocked: boolean = false;
  private _lastChanges = new Date(Number(localStorage.getItem('dashboard-notification-time')));
  private _lastUser = localStorage.getItem('dashboard-notification-user');
  private _notifications = loadNotifications();
  private _filteredNotifications = [];
  private _commentSubscriptions: IdSubscriptionMapper<CommentChangeSubscription> = {};
  private _roomSubscriptions: IdSubscriptionMapper<RoomCommentChangeSubscription> = {};
  private _activeFilter: (notifications: NotificationEvent[]) => NotificationEvent[];

  constructor(
    private wsCommentChangeService: WsCommentChangeService,
    private commentChangeService: CommentChangeService,
    private unloadService: UnloadService,
    private authenticationService: AuthenticationService,
  ) {
    unloadService.onUnload().subscribe(() => {
      localStorage.setItem('dashboard-notification-time', String(this._lastChanges.getTime()));
      localStorage.setItem('dashboard-notification-user', this.authenticationService.getUser()?.id);
      localStorage.setItem('dashboard-notifications', JSON.stringify(this._notifications));
    });
    this.setup();
    this.authenticationService.watchUser.pipe(filter(v => !!v)).subscribe(user => {
      if (user.id === this._lastUser) {
        return;
      }
      this._lastUser = user.id;
      this.cleanup();
      this.setup();
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
  }

  getList(filteredData = false): NotificationEvent[] {
    if (filteredData) {
      return this._filteredNotifications;
    }
    return this._notifications;
  }

  filterNotifications(type: CommentChangeType) {
    this._filteredNotifications.length = 0;
    if (!Object.keys(CommentChangeType).includes(type)) {
      throw new Error('invalid filter argument');
    }
    this._activeFilter = notifications => notifications.filter(n => n.type === type);
    this._filteredNotifications.push(this._activeFilter(this._notifications));
  }

  deleteElement(filtered: boolean, index: number) {
    const elements = [this._notifications, this._filteredNotifications];
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

  filterByString(str: string, mode: boolean) {
    this._filteredNotifications.length = 0;
    const elem = mode ? 'commentNr' : 'roomName';
    this._activeFilter = notifications => notifications.filter(n => n[elem] === str);
    this._filteredNotifications.push(this._activeFilter(this._notifications));
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
    const accountId = this.authenticationService.getUser()?.id;
    const notification: NotificationEvent = {
      ...commentChange,
      fromSelf: accountId === commentChange.initiatorId,
      ownsComment: accountId === commentChange.commentCreatorId,
    };
    this._notifications.unshift(notification);
    if (commentChange.createdAt > this._lastChanges) {
      this._lastChanges = commentChange.createdAt;
    }
    if (this._activeFilter) {
      this._filteredNotifications.unshift(this._activeFilter([notification]));
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
    this.commentChangeService.findAllChangesSince(this._lastChanges).subscribe(changes => {
      changes.forEach(change => {
        change.createdAt = new Date(change.createdAt);
      });
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
