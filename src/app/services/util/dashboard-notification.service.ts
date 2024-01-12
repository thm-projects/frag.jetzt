import { Injectable } from '@angular/core';
import { NotificationEvent } from '../../models/dashboard-notification';
import {
  CommentChange,
  CommentChangeRole,
  CommentChangeType,
} from '../../models/comment-change';
import { WsCommentChangeService } from '../websockets/ws-comment-change.service';
import { CommentChangeService } from '../http/comment-change.service';
import { UnloadService } from './unload.service';
import { Observable, Subject, Subscription, of, tap, throwError } from 'rxjs';
import { IMessage } from '@stomp/stompjs';
import { concatMap, filter, takeUntil } from 'rxjs/operators';
import { SessionService } from './session.service';
import { AccountStateService } from '../state/account-state.service';
import {
  ChangeSubscriptionService,
  DEFAULT_INTEREST,
  PushCommentSubscription,
  PushCommentSubscriptionCreate,
  PushRoomSubscription,
  PushRoomSubscriptionCreate,
} from '../http/change-subscription.service';
import { UUID } from 'app/utils/ts-utils';

const loadNotifications = (): NotificationEvent[] => {
  const arr = JSON.parse(
    localStorage.getItem('dashboard-notifications') || '[]',
  ) as NotificationEvent[];
  arr.forEach((v) => {
    v.createdAt = new Date(v.createdAt);
  });
  return arr;
};

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

type DashboardFilterObject = {
  [key in DashboardFilter]: (
    events: NotificationEvent[],
  ) => NotificationEvent[];
};

@Injectable({
  providedIn: 'root',
})
export class DashboardNotificationService {
  public isNotificationBlocked: boolean = false;
  private invalidator = new Subject();
  private _lastChanges = new Date(
    Number(localStorage.getItem('dashboard-notification-time')),
  );
  private _lastUser = localStorage.getItem('dashboard-notification-user');
  private _notifications = loadNotifications();
  private _filteredNotifications: NotificationEvent[] = [];
  private _roomNotifications: NotificationEvent[] = [];
  private commentSubscriptions: {
    [commentId: string]: {
      subscription: PushCommentSubscription;
      stream: Subscription;
    };
  } = {};
  private roomSubscriptions: {
    [roomId: string]: {
      subscription: PushRoomSubscription;
      stream: Subscription;
    };
  } = {};
  private _activeFilter: (
    notifications: NotificationEvent[],
  ) => NotificationEvent[];
  private _activeFilterName: DashboardFilter;
  private _initialized = false;
  private readonly filterObject: DashboardFilterObject = {
    [DashboardFilter.CommentMarkedWithStar]: (events) =>
      events.filter(
        (e) =>
          e.isAnswer &&
          e.type === CommentChangeType.CHANGE_FAVORITE &&
          e.currentValueString === '1',
      ),
    [DashboardFilter.QuestionMarkedWithStar]: (events) =>
      events.filter(
        (e) =>
          !e.isAnswer &&
          e.type === CommentChangeType.CHANGE_FAVORITE &&
          e.currentValueString === '1',
      ),
    [DashboardFilter.QuestionAffirmed]: (events) =>
      events.filter(
        (e) =>
          !e.isAnswer &&
          e.type === CommentChangeType.CHANGE_CORRECT &&
          e.currentValueString === '1',
      ),
    [DashboardFilter.QuestionAnswered]: (events) =>
      events.filter(
        (e) =>
          !e.isAnswer &&
          e.type === CommentChangeType.ANSWERED &&
          [
            CommentChangeRole.CREATOR,
            CommentChangeRole.EXECUTIVE_MODERATOR,
            CommentChangeRole.EDITING_MODERATOR,
          ].includes(e.initiatorRole),
      ),
    [DashboardFilter.QuestionBanned]: (events) =>
      events.filter(
        (e) =>
          !e.isAnswer &&
          e.type === CommentChangeType.CHANGE_ACK &&
          e.currentValueString === '0',
      ),
    [DashboardFilter.QuestionDeleted]: (events) =>
      events.filter((e) => !e.isAnswer && e.type === CommentChangeType.DELETED),
    [DashboardFilter.QuestionCommented]: (events) =>
      events.filter(
        (e) =>
          !e.isAnswer &&
          e.type === CommentChangeType.ANSWERED &&
          [CommentChangeRole.PARTICIPANT].includes(e.initiatorRole),
      ),
    [DashboardFilter.QuestionNegated]: (events) =>
      events.filter(
        (e) =>
          !e.isAnswer &&
          e.type === CommentChangeType.CHANGE_CORRECT &&
          e.currentValueString === '2',
      ),
    [DashboardFilter.QuestionPublished]: (events) =>
      events.filter(
        (e) =>
          !e.isAnswer &&
          e.type === CommentChangeType.CHANGE_ACK &&
          e.currentValueString === '1',
      ),
  };

  constructor(
    private wsCommentChangeService: WsCommentChangeService,
    private commentChangeService: CommentChangeService,
    private changeSubscriptionService: ChangeSubscriptionService,
    private unloadService: UnloadService,
    private sessionService: SessionService,
    private accountService: AccountStateService,
  ) {
    unloadService.onUnload().subscribe(() => {
      localStorage.setItem(
        'dashboard-notification-time',
        String(this._lastChanges.getTime()),
      );
      localStorage.setItem(
        'dashboard-notification-user',
        this.accountService.getCurrentUser()?.id,
      );
      localStorage.setItem(
        'dashboard-notifications',
        JSON.stringify(this._notifications),
      );
    });
    this.accountService.user$.pipe(filter((v) => !!v)).subscribe((user) => {
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
    this.sessionService.getRoom().subscribe((room) => {
      this._roomNotifications.length = 0;
      this._roomNotifications.push(
        ...this._notifications.filter((n) => n.roomId === room?.id),
      );
      this._activeFilter = null;
    });
  }

  hasCommentSubscription(commentId: string) {
    return Boolean(this.commentSubscriptions[commentId]);
  }

  hasRoomSubscription(roomId: string) {
    return Boolean(this.roomSubscriptions[roomId]);
  }

  addRoomSubscription(
    roomId: UUID,
    ownCommentBits = DEFAULT_INTEREST,
    otherCommentBits = DEFAULT_INTEREST,
  ): Observable<PushRoomSubscription> {
    if (this.hasRoomSubscription(roomId)) {
      return throwError(
        () => new Error('Already subscribed or currently subscribing!'),
      );
    }
    const createPayload: PushRoomSubscriptionCreate = {
      roomId,
      ownCommentBits,
      otherCommentBits,
    };
    this.roomSubscriptions[roomId] = {
      subscription: createPayload as PushRoomSubscription,
      stream: this.wsCommentChangeService
        .getRoomStream(roomId)
        .pipe(takeUntil(this.invalidator))
        .subscribe(this.pushNotification.bind(this)),
    };
    return this.changeSubscriptionService
      .createRoomSubscription(createPayload)
      .pipe(
        tap({
          next: (sub) => (this.roomSubscriptions[roomId].subscription = sub),
          error: () => {
            this.roomSubscriptions[roomId].stream.unsubscribe();
            this.roomSubscriptions[roomId] = undefined;
          },
        }),
      );
  }

  deleteRoomSubscription(roomId: UUID): Observable<any> {
    const data = this.roomSubscriptions[roomId];
    if (!data) {
      return throwError(() => new Error('No active subscription!'));
    }
    if (!data.subscription.id) {
      return throwError(() => new Error('Not activated yet'));
    }
    this.roomSubscriptions[roomId] = undefined;
    data.stream.unsubscribe();
    return this.changeSubscriptionService.deleteRoomSubscription(roomId);
  }

  addCommentSubscription(
    roomId: UUID,
    commentId: UUID,
    interestBits = DEFAULT_INTEREST,
  ): Observable<PushCommentSubscription> {
    if (this.hasCommentSubscription(commentId)) {
      return throwError(
        () => new Error('Already subscribed or currently subscribing!'),
      );
    }
    let pre: Observable<unknown> = of(1);
    if (!this.hasRoomSubscription(roomId)) {
      pre = this.addRoomSubscription(roomId, 0, 0);
    }
    const createPayload: PushCommentSubscriptionCreate = {
      roomId,
      commentId,
      interestBits,
    };
    this.commentSubscriptions[commentId] = {
      subscription: createPayload as PushCommentSubscription,
      stream: this.wsCommentChangeService
        .getCommentStream(roomId, commentId)
        .pipe(takeUntil(this.invalidator))
        .subscribe(this.pushNotification.bind(this)),
    };
    return pre.pipe(
      concatMap(() =>
        this.changeSubscriptionService.createCommentSubscription(createPayload),
      ),
      tap({
        next: (info) => {
          this.commentSubscriptions[commentId].subscription = info;
        },
        error: () => {
          this.commentSubscriptions[commentId].stream.unsubscribe();
          this.commentSubscriptions[commentId] = undefined;
        },
      }),
    );
  }

  deleteCommentSubscription(commentId: UUID): Observable<any> {
    const data = this.commentSubscriptions[commentId];
    if (!data) {
      return throwError(() => new Error('No active comment subscription!'));
    }
    if (!data.subscription.id) {
      return throwError(() => new Error('Not activated yet'));
    }
    this.commentSubscriptions[commentId] = undefined;
    data.stream.unsubscribe();
    return this.changeSubscriptionService.deleteCommentSubscription(commentId);
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
    const accountId = this.accountService.getCurrentUser()?.id;
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
      this._filteredNotifications.unshift(
        ...this._activeFilter([notification]),
      );
    }
  }

  private cleanup() {
    for (const key of Object.keys(this.roomSubscriptions)) {
      this.roomSubscriptions[key] = undefined;
    }
    for (const key of Object.keys(this.commentSubscriptions)) {
      this.commentSubscriptions[key] = undefined;
    }
    this._notifications.length = 0;
    this._filteredNotifications.length = 0;
    this.invalidator.next(true);
  }

  private setup() {
    this._initialized = true;
    this.commentChangeService
      .findAllChangesSince(this._lastChanges)
      .subscribe((changes) => {
        changes.forEach((change) => {
          change.createdAt = new Date(change.createdAt);
        });
        changes = changes.filter(
          (change) => change.createdAt.getTime() > this._lastChanges.getTime(),
        );
        changes.sort((a, b) => Number(a.createdAt) - Number(b.createdAt));
        changes.forEach((change) => this.pushCommentChange(change));
      });
    this.changeSubscriptionService
      .getRoomSubscriptions()
      .subscribe((subscriptions) => {
        subscriptions.forEach((subscription) => {
          this.roomSubscriptions[subscription.roomId] = {
            subscription,
            stream: this.wsCommentChangeService
              .getRoomStream(subscription.roomId)
              .pipe(takeUntil(this.invalidator))
              .subscribe(this.pushNotification.bind(this)),
          };
          subscription.commentSubscriptions.forEach((commentSub) => {
            this.commentSubscriptions[commentSub.commentId] = {
              subscription: commentSub,
              stream: this.wsCommentChangeService
                .getCommentStream(commentSub.roomId, commentSub.commentId)
                .pipe(takeUntil(this.invalidator))
                .subscribe(this.pushNotification.bind(this)),
            };
          });
        });
      });
  }
}
