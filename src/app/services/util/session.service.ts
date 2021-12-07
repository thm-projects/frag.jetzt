import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { Room } from '../../models/room';
import { Moderator } from '../../models/moderator';
import { RoomService } from '../http/room.service';
import { WsRoomService } from '../websockets/ws-room.service';
import { ModeratorService } from '../http/moderator.service';
import { UserRole } from '../../models/user-roles.enum';
import { filter, take } from 'rxjs/operators';
import { AuthenticationService } from '../http/authentication.service';

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

  constructor(
    private router: Router,
    private roomService: RoomService,
    private wsRoomService: WsRoomService,
    private moderatorService: ModeratorService,
    private authenticationService: AuthenticationService,
  ) {
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

  getRole(): Observable<UserRole> {
    return this._currentRole.asObservable();
  }

  get currentRoom(): Room {
    return this._currentRoom.value;
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

  receiveRoomUpdates(before = false): Observable<Partial<Room>> | Observable<Room> {
    if (!this.currentRoom) {
      throw new Error('Currently not bound to a room.');
    }
    return (before ? this._beforeRoomUpdates : this._afterRoomUpdates).asObservable();
  }

  get currentModerators(): Moderator[] {
    return this._currentModerators.value;
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

  private onNavigate() {
    const url = decodeURI(this.router.url);
    const segments = this.router.parseUrl(this.router.url).root.children.primary?.segments;
    if (!segments || segments.length < 3) {
      this._currentRole.next(null);
      this._canChangeRoleOnRoute = false;
      this.clearRoom();
      return;
    }
    switch (segments[0].path) {
      case 'participant':
        this._currentRole.next(UserRole.PARTICIPANT);
        this._canChangeRoleOnRoute = true;
        break;
      case 'moderator':
        this._currentRole.next(UserRole.EXECUTIVE_MODERATOR);
        this._canChangeRoleOnRoute = !url.endsWith('/moderator/comments');
        break;
      case 'creator':
        this._currentRole.next(UserRole.CREATOR);
        this._canChangeRoleOnRoute = !url.endsWith('/moderator/comments');
        break;
      default:
        this._currentRole.next(null);
        this._canChangeRoleOnRoute = false;
        this.clearRoom();
        return;
    }
    if (segments[1].path === 'room') {
      this.loadRoom(segments[2].path);
    }
  }

  private clearRoom() {
    this._roomSubscription?.unsubscribe();
    this._roomSubscription = null;
    this._beforeRoomUpdates?.complete();
    this._beforeRoomUpdates = null;
    this._afterRoomUpdates?.complete();
    this._afterRoomUpdates = null;
    this._currentRoom.next(null);
    this._currentModerators.next(null);
  }

  private loadRoom(shortId: string) {
    if (this.currentRoom?.shortId === shortId) {
      return;
    }
    this.clearRoom();
    this.authenticationService.checkAccess(shortId);
    this.authenticationService.guestLogin(UserRole.PARTICIPANT).subscribe(() => this.fetchRoom(shortId));
  }

  private fetchRoom(shortId: string) {
    this.roomService.getRoomByShortId(shortId).subscribe(room => {
      this._beforeRoomUpdates = new Subject<Partial<Room>>();
      this._afterRoomUpdates = new Subject<Room>();
      this._roomSubscription = this.wsRoomService.getRoomStream(room.id).subscribe(msg => {
        const message = JSON.parse(msg.body);
        if (message.type === 'RoomPatched') {
          const updatedRoom: Partial<Room> = message.payload.changes;
          this._beforeRoomUpdates.next(updatedRoom);
          for (const key of Object.keys(updatedRoom)) {
            room[key] = updatedRoom[key];
          }
          this._afterRoomUpdates.next(room);
        }
      });
      this._currentRoom.next(room);
      this.moderatorService.get(room.id).subscribe(moderators => this._currentModerators.next(moderators));
    });
  }
}
