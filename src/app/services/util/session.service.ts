import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  of,
  ReplaySubject,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
import { Room } from '../../models/room';
import { Moderator } from '../../models/moderator';
import { RoomService } from '../http/room.service';
import { WsRoomService } from '../websockets/ws-room.service';
import { ModeratorService } from '../http/moderator.service';
import { UserRole } from '../../models/user-roles.enum';
import { filter, map, mergeMap, take } from 'rxjs/operators';
import { WsConnectorService } from '../websockets/ws-connector.service';
import { QuillUtils, SerializedDelta } from '../../utils/quill-utils';
import { UserManagementService } from './user-management.service';
import { environment } from 'environments/environment';
import { BrainstormingWord } from 'app/models/brainstorming-word';
import { BrainstormingCategory } from 'app/models/brainstorming-category';
import { BrainstormingService } from '../http/brainstorming.service';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly _currentRole = new BehaviorSubject<UserRole>(null);
  private readonly _currentRoom = new BehaviorSubject<Room>(null);
  private readonly _currentModerators = new BehaviorSubject<Moderator[]>(null);
  private readonly _currentBrainstormingCategories = new BehaviorSubject<
    BrainstormingCategory[]
  >(null);
  private _beforeRoomUpdates: Subject<Partial<Room>>;
  private _afterRoomUpdates: Subject<Room>;
  private _roomSubscription: Subscription;
  private _canChangeRoleOnRoute = false;
  private _currentLoadingShortId = null;
  private _lastShortId = null;
  private _initialized = false;
  private _initFinished = new ReplaySubject(1);

  constructor(
    private router: Router,
    private roomService: RoomService,
    private wsRoomService: WsRoomService,
    private moderatorService: ModeratorService,
    private userManagementService: UserManagementService,
    private wsConnectorService: WsConnectorService,
    private brainstormingService: BrainstormingService,
  ) {}

  get canChangeRoleOnRoute(): boolean {
    return this._canChangeRoleOnRoute;
  }

  get currentRole(): UserRole {
    return this._currentRole.value;
  }

  get currentRoom(): Room {
    return this._currentRoom.value;
  }

  get currentModerators(): Moderator[] {
    return this._currentModerators.value;
  }

  get isReady() {
    return this._initialized;
  }

  get onReady() {
    return this._initFinished.asObservable();
  }

  public static needsUser(router: Router) {
    const url = decodeURI(router.url);
    return !(
      url === '/' ||
      url === '/home' ||
      url === '/quiz' ||
      url === '/data-protection' ||
      url === '/imprint'
    );
  }

  init() {
    if (this._initialized) {
      return;
    }
    this._initialized = true;
    this._initFinished.next(true);
    this._initFinished.complete();
    this.onNavigate();
    this.router.events.subscribe((e) => {
      if (!(e instanceof NavigationEnd)) {
        return;
      }
      this.onNavigate();
    });
  }

  getRole(): Observable<UserRole> {
    return this._currentRole.asObservable();
  }

  getRoom(): Observable<Room> {
    return this._currentRoom.asObservable();
  }

  getRoomOnce(): Observable<Room> {
    return this._currentRoom.pipe(
      filter((v) => !!v),
      take(1),
    );
  }

  receiveRoomUpdates(before = false): Observable<Partial<Room> | Room> {
    if (!this.currentRoom) {
      throw new Error('Currently not bound to a room.');
    }
    return (
      before ? this._beforeRoomUpdates : this._afterRoomUpdates
    ).asObservable();
  }

  getModerators(): Observable<Moderator[]> {
    return this._currentModerators.asObservable();
  }

  getModeratorsOnce(): Observable<Moderator[]> {
    return this._currentModerators.pipe(
      filter((v) => !!v),
      take(1),
    );
  }

  getCategories(): Observable<BrainstormingCategory[]> {
    return this._currentBrainstormingCategories.asObservable();
  }

  getCategoriesOnce(): Observable<BrainstormingCategory[]> {
    return this._currentBrainstormingCategories.pipe(
      filter((v) => !!v),
      take(1),
    );
  }

  validateNewRoute(
    shortId: string,
    urlRole: UserRole,
    requiredRoles: UserRole[],
    onRevalidate: (allowed: boolean, redirect?: UserRole) => void,
  ): boolean {
    if (urlRole === null) {
      onRevalidate(false);
      return false;
    }
    let previous =
      this.userManagementService.getCurrentUser()?.isSuperAdmin ||
      !this._initialized ||
      this.userManagementService.hasAccess(shortId, urlRole);
    this.loadRoom(shortId);
    this.onReady.subscribe(() => {
      const user = this.userManagementService.getCurrentUser();
      if (!user) {
        previous = false;
        onRevalidate(previous);
        return;
      }
      this.ensureRole(user.id).subscribe((role) => {
        if (user.isSuperAdmin) {
          previous = true;
          onRevalidate(previous);
          return;
        }
        if (role >= urlRole) {
          previous = true;
          onRevalidate(previous);
        } else if (requiredRoles.includes(role)) {
          previous = undefined;
          onRevalidate(previous, role);
        } else {
          previous = false;
          onRevalidate(previous);
        }
      });
    });
    return previous;
  }

  updateCurrentRoom(room: Partial<Room>): void {
    const current = this._currentRoom.getValue();
    for (const key of Object.keys(room)) {
      if (key === 'description') {
        current[key] = QuillUtils.deserializeDelta(
          room[key] as unknown as SerializedDelta,
        );
      } else {
        current[key] = room[key];
      }
    }
  }

  getLastShortId() {
    return this._lastShortId;
  }

  private ensureRole(userId: string): Observable<UserRole> {
    return this.getRoomOnce().pipe(
      switchMap((room) => {
        if (room.ownerId === userId) {
          this.userManagementService.setAccess(
            room.shortId,
            room.id,
            UserRole.CREATOR,
          );
          return of(UserRole.CREATOR);
        }
        return this.getModeratorsOnce().pipe(
          map((mods) => {
            if (mods.some((m) => m.accountId === userId)) {
              this.userManagementService.setAccess(
                room.shortId,
                room.id,
                UserRole.EXECUTIVE_MODERATOR,
              );
              return UserRole.EXECUTIVE_MODERATOR;
            }
            this.userManagementService.setAccess(
              room.shortId,
              room.id,
              UserRole.PARTICIPANT,
            );
            return UserRole.PARTICIPANT;
          }),
        );
      }),
    );
  }

  private onNavigate() {
    const url = decodeURI(this.router.url);
    const segments = this.router.parseUrl(this.router.url).root.children.primary
      ?.segments;
    if (!segments || segments.length < 3) {
      this._canChangeRoleOnRoute = false;
      this._currentRole.next(null);
      this.clearRoom();
      this.checkUser();
      return;
    }
    switch (segments[0].path) {
      case 'participant':
        this._canChangeRoleOnRoute = true;
        this._currentRole.next(UserRole.PARTICIPANT);
        break;
      case 'moderator':
        this._canChangeRoleOnRoute =
          !url.endsWith('/moderator/comments') && segments[1]?.path !== 'join';
        this._currentRole.next(UserRole.EXECUTIVE_MODERATOR);
        break;
      case 'creator':
        this._canChangeRoleOnRoute = !url.endsWith('/moderator/comments');
        this._currentRole.next(UserRole.CREATOR);
        break;
      default:
        this._canChangeRoleOnRoute = false;
        this._currentRole.next(null);
        this.clearRoom();
        this.checkUser();
        return;
    }
    if (segments[1].path === 'room') {
      this.loadRoom(segments[2].path);
    }
  }

  private clearRoom() {
    this._currentLoadingShortId = null;
    this._roomSubscription?.unsubscribe();
    this._roomSubscription = null;
    this._beforeRoomUpdates?.complete();
    this._beforeRoomUpdates = null;
    this._afterRoomUpdates?.complete();
    this._afterRoomUpdates = null;
    if (this._currentRoom.value) {
      this._currentRoom.next(null);
    }
    if (this._currentModerators.value) {
      this._currentModerators.next(null);
    }
    if (this._currentBrainstormingCategories.value) {
      this._currentBrainstormingCategories.next(null);
    }
  }

  private loadRoom(shortId: string) {
    if (this._currentLoadingShortId === shortId) {
      return;
    }
    this._lastShortId = shortId;
    this.clearRoom();
    this._currentLoadingShortId = shortId;
    this._initFinished.pipe(take(1)).subscribe(() => {
      this.userManagementService
        .forceLogin()
        .pipe(
          map((data) => {
            this.userManagementService.setCurrentAccess(shortId);
            return data;
          }),
          mergeMap((_) =>
            this.wsConnectorService.connected$.pipe(
              filter((v) => !!v),
              take(1),
            ),
          ),
        )
        .subscribe((_) => this.fetchRoom(shortId));
    });
  }

  private fetchRoom(shortId: string) {
    this.roomService.getRoomByShortId(shortId).subscribe((room) => {
      this.roomService.addToHistory(room.id);
      this.userManagementService.ensureAccess(
        shortId,
        room.id,
        UserRole.PARTICIPANT,
      );
      this._beforeRoomUpdates = new Subject<Partial<Room>>();
      this._afterRoomUpdates = new Subject<Room>();
      this._roomSubscription = this.wsRoomService
        .getRoomStream(room.id)
        .subscribe((msg) => this.receiveMessage(msg, room));
      this._currentRoom.next(room);
      this.moderatorService
        .get(room.id)
        .subscribe((moderators) => this._currentModerators.next(moderators));
      this.brainstormingService.getCategories(room.id).subscribe({
        next: (categories) =>
          this._currentBrainstormingCategories.next(categories),
      });
    });
  }

  private receiveMessage(msg: any, room: Room) {
    const message = JSON.parse(msg.body);
    if (message.roomId && message.roomId !== room.id) {
      console.error('Wrong room!', message);
      return;
    }
    if (message.type === 'RoomPatched') {
      const updatedRoom: Partial<Room> = message.payload.changes;
      this._beforeRoomUpdates.next(updatedRoom);
      this.updateCurrentRoom(updatedRoom);
      this._afterRoomUpdates.next(room);
    } else if (
      message.type === 'BrainstormingDeleted' &&
      room.brainstormingSession?.id === message.payload.id
    ) {
      this._beforeRoomUpdates.next({ brainstormingSession: null });
      room.brainstormingSession = null;
      this._afterRoomUpdates.next(room);
    } else if (message.type === 'BrainstormingCreated') {
      this._beforeRoomUpdates.next({
        brainstormingSession: message.payload,
      });
      room.brainstormingSession = message.payload;
      this._afterRoomUpdates.next(room);
    } else if (message.type === 'BrainstormingVoteUpdated') {
      this.onBrainstormingVoteUpdated(message, room);
    } else if (message.type === 'BrainstormingWordCreated') {
      this.onBrainstormingWordCreated(message, room);
    } else if (message.type === 'BrainstormingWordPatched') {
      this.onBrainstormingWordPatched(message, room);
    } else if (message.type === 'BrainstormingCategoriesUpdated') {
      this._currentBrainstormingCategories.next(message.payload.categoryList);
    } else if (message.type === 'BrainstormingVotesReset') {
      this.onBrainstormingVoteReset(message, room);
    } else if (message.type === 'BrainstormingPatched') {
      this.onBrainstormingPatched(message, room);
    } else if (message.type === 'BrainstormingCategorizationReset') {
      this.onBrainstormingCategorizationReset(message, room);
    } else if (!environment.production) {
      console.log('Ignored: ', message);
    }
  }

  private onBrainstormingCategorizationReset(message: any, room: Room) {
    const id = room.brainstormingSession?.id;
    if (id !== message.payload.sessionId) {
      return;
    }
    this._beforeRoomUpdates.next(room);
    const obj = room.brainstormingSession.wordsWithMeta;
    Object.keys(obj).forEach((key) => (obj[key].word.categoryId = null));
    this._afterRoomUpdates.next(room);
  }

  private onBrainstormingPatched(message: any, room: Room) {
    const id = room.brainstormingSession?.id;
    if (id !== message.payload.id) {
      return;
    }
    this._beforeRoomUpdates.next(room);
    Object.keys(message.payload.changes).forEach((key) => {
      const change = message.payload.changes[key];
      if (key === 'ideasEndTimestamp' && change) {
        room.brainstormingSession[key] = new Date(change);
      } else {
        room.brainstormingSession[key] = change;
      }
    });
    this._afterRoomUpdates.next(room);
  }

  private onBrainstormingVoteReset(message: any, room: Room) {
    const id = room.brainstormingSession?.id;
    if (id !== message.payload.sessionId) {
      return;
    }
    this._beforeRoomUpdates.next(room);
    const obj = room.brainstormingSession.wordsWithMeta;
    Object.keys(obj).forEach((key) => {
      obj[key].ownHasUpvoted = null;
      obj[key].word.downvotes = 0;
      obj[key].word.upvotes = 0;
    });
    this._afterRoomUpdates.next(room);
  }

  private onBrainstormingWordPatched(message: any, room: Room) {
    const wordId = message.payload.id;
    const entry = room.brainstormingSession?.wordsWithMeta?.[wordId];
    if (!entry) {
      return;
    }
    this._beforeRoomUpdates.next(room);
    const changes = message.payload.changes;
    Object.keys(changes).forEach((key) => {
      entry.word[key] = changes[key];
    });
    this._afterRoomUpdates.next(room);
  }

  private onBrainstormingWordCreated(message: any, room: Room) {
    const word = new BrainstormingWord(
      message.payload.id,
      message.payload.sessionId,
      message.payload.name,
    );
    if (word.sessionId !== room.brainstormingSession?.id) {
      console.error('Wrong session');
      return;
    }
    this._beforeRoomUpdates.next({
      brainstormingSession: {
        ...room.brainstormingSession,
        wordsWithMeta: {
          ...room.brainstormingSession?.wordsWithMeta,
          [word.id]: {
            word,
            ownHasUpvoted: null,
          },
        },
      },
    });
    room.brainstormingSession.wordsWithMeta[word.id] = {
      word,
      ownHasUpvoted: null,
    };
    this._afterRoomUpdates.next(room);
  }

  private onBrainstormingVoteUpdated(message: any, room: Room) {
    const wordId = message.payload.wordId;
    const upvotes = message.payload.upvotes;
    const downvotes = message.payload.downvotes;
    const entry = room.brainstormingSession?.wordsWithMeta?.[wordId];
    if (!entry) {
      return;
    }
    this._beforeRoomUpdates.next(room);
    entry.word.downvotes = downvotes;
    entry.word.upvotes = upvotes;
    this._afterRoomUpdates.next(room);
  }

  private checkUser() {
    if (!SessionService.needsUser(this.router)) {
      return;
    }
    this.userManagementService.forceLogin().subscribe();
  }
}
