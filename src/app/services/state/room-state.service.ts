import { Injectable } from '@angular/core';
import { Room } from 'app/models/room';
import { UserRole } from 'app/models/user-roles.enum';
import {
  Observable,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { AccountStateService } from './account-state.service';
import { OnlineStateService } from './online-state.service';
import { RoomService } from '../http/room.service';
import { ModeratorService } from '../http/moderator.service';
import { CommentService } from '../http/comment.service';
import { Comment } from 'app/models/comment';
import { LocationStateService } from './location-state.service';
import { Router } from '@angular/router';
import {
  ROOM_ROLE_ORDER,
  RoomAccessRole,
} from 'app/base/db/models/db-room-access.model';
import { dataService } from 'app/base/db/data-service';
import { Moderator } from 'app/base/db/models/db-moderator';
import { user$ } from 'app/user/state/user';

export const ROOM_ROLE_MAPPER: { [Key in RoomAccessRole]: UserRole } = {
  Participant: UserRole.PARTICIPANT,
  Moderator: UserRole.EXECUTIVE_MODERATOR,
  Creator: UserRole.CREATOR,
} as const;

export const ROUTE_TO_ROOM_ROLE: { [key: string]: RoomAccessRole } = {
  participant: 'Participant',
  moderator: 'Moderator',
  creator: 'Creator',
};

@Injectable({
  providedIn: 'root',
})
export class RoomStateService {
  readonly roomShortId$: Observable<string>;
  readonly room$: Observable<Room>;
  readonly role$: Observable<RoomAccessRole>;
  readonly assignedRole$: Observable<RoomAccessRole>;
  readonly moderators$: Observable<Set<string>>;
  readonly comments$: Observable<Comment[]>;

  constructor(
    private accountState: AccountStateService,
    private onlineState: OnlineStateService,
    private roomService: RoomService,
    private moderatorService: ModeratorService,
    private commentService: CommentService,
    private router: Router,
    locationState: LocationStateService,
  ) {
    this.roomShortId$ = locationState.currentRecognized$.pipe(
      map((v) => (v?.metadata?.isRoom ? v.data[2] : null)),
      distinctUntilChanged(),
    );
    this.assignedRole$ = locationState.currentRecognized$.pipe(
      map((v) =>
        v?.metadata?.isRoom
          ? ROUTE_TO_ROOM_ROLE[v.data[1].toLowerCase()] || null
          : null,
      ),
      distinctUntilChanged(),
    );
    this.role$ = this.roomShortId$.pipe(
      startWith(null),
      switchMap((shortId) =>
        combineLatest([
          user$.pipe(filter((v) => Boolean(v))),
          accountState.access$.pipe(filter((v) => Boolean(v))),
        ]).pipe(
          map(
            ([user, access]) =>
              access.find(
                (a) => a.roomShortId === shortId && a.userId === user.id,
              )?.role,
          ),
        ),
      ),
      shareReplay(1),
    );
    this.room$ = combineLatest([
      this.roomShortId$,
      user$.pipe(filter((v) => Boolean(v))),
    ]).pipe(
      startWith([null, null]),
      switchMap(([shortId]) => {
        if (!shortId) {
          return of(null);
        }
        return onlineState
          .refreshWhenReachable(
            dataService.room.getByIndex('short-id', shortId),
            this.roomService
              .getRoomByShortId(shortId)
              .pipe(
                tap((room) =>
                  dataService.room.createOrUpdate(room).subscribe(),
                ),
              ),
          )
          .pipe(startWith(null));
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.moderators$ = this.room$.pipe(
      startWith(null),
      switchMap((room) => {
        if (!room) {
          return of(null);
        }
        return onlineState
          .refreshWhenReachable(
            dataService.moderator
              .getAllByIndex('room-id', room.id)
              .pipe(map((mods) => new Set(mods.map((m) => m.accountId)))),
            this.moderatorService.get(room.id).pipe(
              map((mods) => new Set(mods.map((m) => m.accountId))),
              tap((modsSet) =>
                dataService.moderator
                  .createOrUpdateMany(
                    [...modsSet].map((accountId) => ({
                      value: new Moderator({ roomId: room.id, accountId }),
                    })),
                  )
                  .subscribe(),
              ),
            ),
          )
          .pipe(startWith(null));
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.comments$ = this.room$.pipe(
      startWith(null),
      switchMap((room) => {
        if (!room) {
          return of(null);
        }
        return onlineState
          .refreshWhenReachable(
            dataService.comment.getAllByIndex('room-id', room.id),
            this.commentService
              .getComments(room.id)
              .pipe(
                tap((data) =>
                  dataService.comment
                    .createOrUpdateMany(data.map((value) => ({ value })))
                    .subscribe(),
                ),
              ),
          )
          .pipe(startWith(null));
      }),
      distinctUntilChanged(),
      shareReplay(),
    );
  }

  getCurrentRoom(): Room {
    let room = null;
    this.room$.subscribe((r) => (room = r)).unsubscribe();
    return room;
  }

  getCurrentRole(): RoomAccessRole {
    let access = null;
    this.role$.subscribe((a) => (access = a)).unsubscribe();
    return access;
  }

  getCurrentAssignedRole(): RoomAccessRole {
    let access = null;
    this.assignedRole$.subscribe((a) => (access = a)).unsubscribe();
    return access;
  }

  assignRole(role: RoomAccessRole): boolean {
    const current = this.getCurrentRole();
    if (
      current === null ||
      current === undefined ||
      role === null ||
      role === undefined ||
      ROOM_ROLE_ORDER.indexOf(current) < ROOM_ROLE_ORDER.indexOf(role)
    ) {
      return false;
    }
    const url = LocationStateService.getCurrentLocation(this.router.url);
    const index = url.indexOf('/', 1);
    this.router.navigate(['/' + role.toLowerCase() + url.substring(index)]);
    return true;
  }
}
