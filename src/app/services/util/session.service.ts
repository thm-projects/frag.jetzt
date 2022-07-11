import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable, PartialObserver, Subject, Subscription } from 'rxjs';
import { Room } from '../../models/room';
import { Moderator } from '../../models/moderator';
import { RoomService } from '../http/room.service';
import { WsRoomService } from '../websockets/ws-room.service';
import { ModeratorService } from '../http/moderator.service';
import { UserRole } from '../../models/user-roles.enum';
import { filter, mergeMap, take } from 'rxjs/operators';
import { AuthenticationService, LoginResult } from '../http/authentication.service';
import { WsConnectorService } from '../websockets/ws-connector.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  private readonly _currentRole = new BehaviorSubject<UserRole>(null);
  private readonly _currentRoom = new BehaviorSubject<Room>(null);
  private readonly _currentModerators = new BehaviorSubject<Moderator[]>(null);
  private _beforeRoomUpdates: Subject<Partial<Room>>;
  private _afterRoomUpdates: Subject<Room>;
  private _roomSubscription: Subscription;
  private _canChangeRoleOnRoute = false;
  private _currentLoadingShortId = null;
  private _lastShortId = null;

  constructor(
    private router: Router,
    private roomService: RoomService,
    private wsRoomService: WsRoomService,
    private moderatorService: ModeratorService,
    private authenticationService: AuthenticationService,
    private wsConnectorService: WsConnectorService,
  ) {
    if (this.authenticationService.wasLoggedIn()) {
      this.authenticationService.refreshLogin().subscribe(this.loginObserver());
    }
    this.onNavigate();
    this.router.events.subscribe(e => {
      if (!(e instanceof NavigationEnd)) {
        return;
      }
      this.onNavigate();
    });
  }

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

  public static needsUser(router: Router) {
    const url = decodeURI(router.url);
    return !(url === '/' || url === '/home' || url === '/quiz' || url === '/data-protection' || url === '/imprint');
  }

  getRole(): Observable<UserRole> {
    return this._currentRole.asObservable();
  }

  getRoom(): Observable<Room> {
    return this._currentRoom.asObservable();
  }

  getRoomOnce(): Observable<Room> {
    return this._currentRoom.pipe(
      filter(v => !!v),
      take(1)
    );
  }

  receiveRoomUpdates(before = false): Observable<Partial<Room> | Room> {
    if (!this.currentRoom) {
      throw new Error('Currently not bound to a room.');
    }
    return (before ? this._beforeRoomUpdates : this._afterRoomUpdates).asObservable();
  }

  getModerators(): Observable<Moderator[]> {
    return this._currentModerators.asObservable();
  }

  getModeratorsOnce(): Observable<Moderator[]> {
    return this._currentModerators.pipe(
      filter(v => !!v),
      take(1)
    );
  }

  validateNewRoute(shortId: string, requiredRole: UserRole, onRevalidate: (allowed: boolean) => void): boolean {
    this.loadRoom(shortId);
    requiredRole = requiredRole || UserRole.PARTICIPANT;
    const userId = this.authenticationService.getUser()?.id;
    this.getRoomOnce().subscribe(room => {
      if (room.ownerId === userId) {
        this.authenticationService.setAccess(shortId, UserRole.CREATOR);
        onRevalidate(true);
        return;
      }
      if (requiredRole === UserRole.CREATOR) {
        onRevalidate(false);
        return;
      }
      this.getModeratorsOnce().subscribe(mods => {
        if (mods.some(m => m.accountId === userId)) {
          this.authenticationService.setAccess(shortId, UserRole.EXECUTIVE_MODERATOR);
          onRevalidate(true);
          return;
        }
        this.authenticationService.setAccess(shortId, UserRole.PARTICIPANT);
        onRevalidate(false);
      });
    });
    return this.authenticationService.hasAccess(shortId, requiredRole) || requiredRole === UserRole.PARTICIPANT;
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

  private onNavigate() {
    const url = decodeURI(this.router.url);
    const segments = this.router.parseUrl(this.router.url).root.children.primary?.segments;
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
        this._canChangeRoleOnRoute = !url.endsWith('/moderator/comments') && segments[1]?.path !== 'join';
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
  }

  private loadRoom(shortId: string) {
    if (this._currentLoadingShortId === shortId) {
      return;
    }
    this._lastShortId = shortId;
    this.clearRoom();
    this._currentLoadingShortId = shortId;
    this.authenticationService.checkAccess(shortId);
    this.authenticationService.guestLogin(UserRole.PARTICIPANT).pipe(
      mergeMap(_ => this.wsConnectorService.connected$.pipe(filter(v => !!v), take(1)))
    ).subscribe(_ => this.fetchRoom(shortId));
  }

  private fetchRoom(shortId: string) {
    this.roomService.getRoomByShortId(shortId).subscribe(room => {
      this.roomService.addToHistory(room.id);
      if (!this.authenticationService.hasAccess(shortId, UserRole.PARTICIPANT)) {
        this.authenticationService.setAccess(shortId, UserRole.PARTICIPANT);
      }
      this._beforeRoomUpdates = new Subject<Partial<Room>>();
      this._afterRoomUpdates = new Subject<Room>();
      this._roomSubscription = this.wsRoomService.getRoomStream(room.id).subscribe(msg => {
        const message = JSON.parse(msg.body);
        if (message.type === 'RoomPatched') {
          const updatedRoom: Partial<Room> = message.payload.changes;
          this._beforeRoomUpdates.next(updatedRoom);
          this.updateCurrentRoom(updatedRoom);
          this._afterRoomUpdates.next(room);
        } else if (message.type === 'BrainstormingDeleted' &&
          room.brainstormingSession?.id === message.payload.id) {
          this._beforeRoomUpdates.next({ brainstormingSession: null });
          room.brainstormingSession = null;
          this._afterRoomUpdates.next(room);
        } else if (message.type === 'BrainstormingCreated') {
          this._beforeRoomUpdates.next({ brainstormingSession: message.payload });
          room.brainstormingSession = message.payload;
          this._afterRoomUpdates.next(room);
        } else if (message.type === 'BrainstormingClosed' &&
          room.brainstormingSession?.id === message.payload.id) {
          this._beforeRoomUpdates.next({ brainstormingSession: { ...room.brainstormingSession, active: false } });
          room.brainstormingSession.active = false;
          this._afterRoomUpdates.next(room);
        } else if (message.type === 'BrainstormingVoteUpdated') {
          this.onBrainstormingVoteUpdated(message, room);
        }
      });
      this._currentRoom.next(room);
      this.moderatorService.get(room.id).subscribe(moderators => this._currentModerators.next(moderators));
    });
  }

  private onBrainstormingVoteUpdated(message: any, room: Room) {
    const { word, ...obj } = message.payload;
    this._beforeRoomUpdates.next(room);
    if (!room.brainstormingSession.votesForWords) {
      room.brainstormingSession.votesForWords = {
        [word]: {
          ...obj,
          ownHasUpvoted: undefined
        }
      };
    } else {
      const previous = room.brainstormingSession.votesForWords[word];
      if (!previous) {
        room.brainstormingSession.votesForWords[word] = {
          ...obj,
          ownHasUpvoted: undefined
        };
      } else {
        previous.upvotes = obj.upvotes;
        previous.downvotes = obj.downvotes;
      }
    }
    this._afterRoomUpdates.next(room);
  }

  private checkUser() {
    if (!SessionService.needsUser(this.router)) {
      return;
    }
    this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(this.loginObserver());
  }

  private loginObserver(): PartialObserver<LoginResult> {
    const goHome = () => {
      if (SessionService.needsUser(this.router)) {
        this.router.navigate(['/']);
      }
    };
    return {
      next: value => {
        if (value !== LoginResult.Success) {
          goHome();
        }
      },
      error: _ => goHome()
    };
  }
}
