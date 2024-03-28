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
import { environment } from 'environments/environment';
import { BrainstormingWord } from 'app/models/brainstorming-word';
import { BrainstormingCategory } from 'app/models/brainstorming-category';
import { BrainstormingService } from '../http/brainstorming.service';
import { BrainstormingSession } from 'app/models/brainstorming-session';
import { GptService, RoomAccessInfo } from '../http/gpt.service';
import { LivepollSession } from '../../models/livepoll-session';
import { LivepollEventType, LivepollService } from '../http/livepoll.service';
import { WsGlobalService } from '../websockets/ws-global.service';
import { GlobalCountChanged } from 'app/models/global-count-changed';
import { AccountStateService } from '../state/account-state.service';
import { RoomStateService } from '../state/room-state.service';
import { UUID } from 'app/utils/ts-utils';

interface Message {
  type: string;
  payload: {
    sessionId: UUID;
    id: UUID;
    changes?: Record<string, unknown>;
    name: string;
    correctedWord: string;
    wordId: UUID;
    upvotes: number;
    downvotes: number;
    livepoll: LivepollSession;
  };
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly globalData = new BehaviorSubject<GlobalCountChanged>(null);
  private readonly _currentRoom = new BehaviorSubject<Room>(null);
  private readonly _currentModerators = new BehaviorSubject<Moderator[]>(null);
  private readonly _currentBrainstormingCategories = new BehaviorSubject<
    BrainstormingCategory[]
  >(null);
  private readonly _currentGPTRoomStatus = new BehaviorSubject<RoomAccessInfo>(
    null,
  );
  private readonly _currentLivepollSession =
    new BehaviorSubject<LivepollSession>(null);
  private _beforeRoomUpdates: Subject<Partial<Room>>;
  private _afterRoomUpdates: Subject<Room>;
  private _roomSubscription: Subscription;
  private _currentLoadingShortId = null;
  private _lastShortId = null;
  private _initialized = false;
  private _initFinished = new ReplaySubject(1);

  constructor(
    private router: Router,
    private roomService: RoomService,
    private wsRoomService: WsRoomService,
    private moderatorService: ModeratorService,
    private wsConnectorService: WsConnectorService,
    private brainstormingService: BrainstormingService,
    private gptService: GptService,
    private livepollService: LivepollService,
    private wsGlobal: WsGlobalService,
    private accountState: AccountStateService,
    private roomState: RoomStateService,
  ) {
    this.init();
  }

  get currentLivepoll(): LivepollSession {
    return this._currentLivepollSession.value;
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

  public static needsUser(url: string) {
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
    this.wsGlobal.getGlobalCountStream().subscribe((e) => {
      const data = JSON.parse(e.body)?.['GlobalCountChanged'];
      if (data) {
        this.globalData.next(new GlobalCountChanged(data));
      }
    });
  }

  getGlobalData(): Observable<GlobalCountChanged> {
    return this.globalData.asObservable();
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

  getGPTStatus(): Observable<RoomAccessInfo> {
    return this._currentGPTRoomStatus;
  }

  getGPTStatusOnce(): Observable<RoomAccessInfo> {
    return this._currentGPTRoomStatus.pipe(
      filter((v) => Boolean(v)),
      take(1),
    );
  }

  updateStatus() {
    this.gptService
      .getStatusForRoom(this._currentRoom.value?.id)
      .subscribe((roomStatus) => this._currentGPTRoomStatus.next(roomStatus));
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
      !this._initialized || this.accountState.hasAccess(shortId, urlRole);
    this.loadRoom(shortId);
    this.onReady.subscribe(() => {
      const user = this.accountState.getCurrentUser();
      if (!user) {
        previous = false;
        onRevalidate(previous);
        return;
      }
      this.ensureRole(user.id).subscribe((role) => {
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
      current[key] = room[key];
    }
  }

  getLastShortId() {
    return this._lastShortId;
  }

  private ensureRole(userId: string): Observable<UserRole> {
    return this.getRoomOnce().pipe(
      switchMap((room) => {
        if (room.ownerId === userId) {
          this.accountState
            .setAccess(room.shortId, room.id, UserRole.CREATOR)
            .subscribe();
          return of(UserRole.CREATOR);
        }
        return this.getModeratorsOnce().pipe(
          map((mods) => {
            if (mods.some((m) => m.accountId === userId)) {
              this.accountState
                .setAccess(room.shortId, room.id, UserRole.EXECUTIVE_MODERATOR)
                .subscribe();
              return UserRole.EXECUTIVE_MODERATOR;
            }
            this.accountState
              .setAccess(room.shortId, room.id, UserRole.PARTICIPANT)
              .subscribe();
            return UserRole.PARTICIPANT;
          }),
        );
      }),
    );
  }

  private onNavigate() {
    const segments = this.router.parseUrl(this.router.url).root.children[
      'primary'
    ]?.segments;
    if (!segments || segments.length < 3) {
      this.clearRoom();
      return;
    }
    switch (segments[0].path) {
      case 'participant':
      case 'moderator':
      case 'creator':
        break;
      default:
        this.clearRoom();
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
    if (this._currentGPTRoomStatus.value) {
      this._currentGPTRoomStatus.next(null);
    }
    if (this._currentBrainstormingCategories.value) {
      this._currentBrainstormingCategories.next(null);
    }
    if (this._currentLivepollSession.value) {
      this._currentLivepollSession.next(null);
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
      this.accountState
        .forceLogin()
        .pipe(
          map((data) => {
            this.accountState.updateAccess(shortId);
            return data;
          }),
          mergeMap(() =>
            this.wsConnectorService.connected$.pipe(
              filter((v) => !!v),
              take(1),
            ),
          ),
        )
        .subscribe(() => this.fetchRoom(shortId));
    });
  }

  private fetchRoom(shortId: string) {
    this.roomService.getRoomByShortId(shortId).subscribe((room) => {
      this.roomService.addToHistory(room.id);
      this.accountState.ensureAccess(shortId, room.id, UserRole.PARTICIPANT);
      this._beforeRoomUpdates = new Subject<Partial<Room>>();
      this._afterRoomUpdates = new Subject<Room>();
      this._roomSubscription = this.wsRoomService
        .getRoomStream(room.id)
        .subscribe((msg) => this.receiveMessage(msg, room));
      this._currentRoom.next(room);
      this._currentLivepollSession.next(room.livepollSession);
      this.updateStatus();
      this.moderatorService
        .get(room.id)
        .subscribe((moderators) => this._currentModerators.next(moderators));
      this.brainstormingService.getCategories(room.id).subscribe({
        next: (categories) =>
          this._currentBrainstormingCategories.next(categories),
      });
      const _beforeActive = new BehaviorSubject<boolean>(false);
      _beforeActive.subscribe((x) => {
        if (x) {
          if (!this.livepollService.isOpen) {
            this.livepollService.open(this);
          }
        }
      });
      this.receiveRoomUpdates().subscribe(() => {
        if (_beforeActive.value !== !!this.currentLivepoll?.active) {
          _beforeActive.next(!!this.currentLivepoll?.active);
        }
      });
      if (this._currentLivepollSession.value?.active) {
        if (!this.livepollService.isOpen) {
          this.livepollService.open(this);
        }
      }
    });
  }

  private receiveMessage(msg: { body: string }, room: Room) {
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
      const newSession = new BrainstormingSession(message.payload.session);
      this._beforeRoomUpdates.next({
        brainstormingSession: newSession,
      });
      room.brainstormingSession = newSession;
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
    } else if (message.type === 'LivepollSessionCreated') {
      this.onLivepollCreated(message, room);
    } else if (message.type === 'LivepollSessionPatched') {
      this.onLivepollPatched(message, room);
    } else if (!environment.production) {
      console.log('Ignored: ', message);
    }
  }

  private onBrainstormingCategorizationReset(message: Message, room: Room) {
    const id = room.brainstormingSession?.id;
    if (id !== message.payload.sessionId) {
      return;
    }
    this._beforeRoomUpdates.next(room);
    const obj = room.brainstormingSession.wordsWithMeta;
    Object.keys(obj).forEach((key) => (obj[key].word.categoryId = null));
    this._afterRoomUpdates.next(room);
  }

  private onBrainstormingPatched(message: Message, room: Room) {
    const id = room.brainstormingSession?.id;
    if (id !== message.payload.id) {
      return;
    }
    this._beforeRoomUpdates.next(room);
    Object.keys(message.payload.changes).forEach((key) => {
      const change = message.payload.changes[key];
      if (key === 'ideasEndTimestamp' && change) {
        room.brainstormingSession[key] = new Date(change as Date);
      } else {
        room.brainstormingSession[key] = change;
      }
    });
    this._afterRoomUpdates.next(room);
  }

  private onBrainstormingVoteReset(message: Message, room: Room) {
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

  private onBrainstormingWordPatched(message: Message, room: Room) {
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

  private onBrainstormingWordCreated(message: Message, room: Room) {
    const word = new BrainstormingWord({} as BrainstormingWord);
    word.id = message.payload.id;
    word.sessionId = message.payload.sessionId;
    word.word = message.payload.name;
    word.correctedWord = message.payload.correctedWord;
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

  private onBrainstormingVoteUpdated(message: Message, room: Room) {
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

  private onLivepollCreated(message: Message, room: Room) {
    this._beforeRoomUpdates.next(room);
    const livepollSessionObject = new LivepollSession(message.payload.livepoll);
    this._currentLivepollSession.next(livepollSessionObject);
    this.updateCurrentRoom({
      livepollSession: livepollSessionObject,
    });
    this._afterRoomUpdates.next(room);
    this.livepollService.emitEvent(
      this.currentLivepoll,
      {},
      LivepollEventType.Create,
    );
  }

  private onLivepollPatched(message: Message, room: Room) {
    const id = room.livepollSession?.id;
    if (id !== message.payload.id) {
      // skip
      return;
    }
    this._beforeRoomUpdates.next(room);
    const changes = message.payload.changes;
    if (typeof changes['active'] !== 'undefined') {
      if (!changes['active']) {
        room.livepollSession = null;
        const cached = this.currentLivepoll;
        this._currentLivepollSession.next(null);
        this.livepollService.emitEvent(
          cached,
          changes,
          LivepollEventType.Delete,
        );
      }
    } else {
      for (const key of Object.keys(changes)) {
        room.livepollSession[key] = changes[key];
      }
      this.livepollService.emitEvent(
        this.currentLivepoll,
        changes,
        LivepollEventType.Patch,
      );
    }
    this._afterRoomUpdates.next(room);
  }
}
