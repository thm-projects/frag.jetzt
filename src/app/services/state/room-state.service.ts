import { Injectable } from '@angular/core';
import { Room } from 'app/models/room';
import { UserRole } from 'app/models/user-roles.enum';
import {
  BehaviorSubject,
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
import { DbRoomService } from '../persistence/lg/db-room.service';
import { RoomService } from '../http/room.service';
import { ModeratorService } from '../http/moderator.service';
import { DbModeratorService } from '../persistence/lg/db-moderator.service';
import { DbCommentService } from '../persistence/lg/db-comment.service';
import { CommentService } from '../http/comment.service';
import { Comment } from 'app/models/comment';
import { RoomAccessRole } from '../persistence/lg/db-room-acces.model';
import { Moderator } from '../persistence/lg/db-moderator.model';

@Injectable({
  providedIn: 'root',
})
export class RoomStateService {
  readonly roomShortId$: Observable<string>;
  readonly room$: Observable<Room>;
  readonly role$: Observable<RoomAccessRole>;
  readonly moderators$: Observable<Set<string>>;
  readonly comments$: Observable<Comment[]>;
  private readonly updateRoomShortId$ = new BehaviorSubject<string>(null);

  constructor(
    private accountState: AccountStateService,
    private onlineState: OnlineStateService,
    private dbRoom: DbRoomService,
    private roomService: RoomService,
    private moderatorService: ModeratorService,
    private dbModerator: DbModeratorService,
    private dbComment: DbCommentService,
    private commentService: CommentService,
  ) {
    this.roomShortId$ = this.updateRoomShortId$;
    this.role$ = this.roomShortId$.pipe(
      startWith(null),
      switchMap((shortId) =>
        combineLatest([
          accountState.user$.pipe(filter((v) => Boolean(v))),
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
    this.room$ = this.roomShortId$.pipe(
      startWith(null),
      switchMap((shortId) => {
        if (!shortId) {
          return of(null);
        }
        return onlineState.refreshWhenReachable(
          this.dbRoom.getByIndex('short-id', shortId),
          this.roomService
            .getRoomByShortId(shortId)
            .pipe(tap((room) => this.dbRoom.createOrUpdate(room).subscribe())),
        );
      }),
      shareReplay(1),
    );
    this.moderators$ = this.room$.pipe(
      startWith(null),
      switchMap((room) => {
        if (!room) {
          return of(null);
        }
        return onlineState.refreshWhenReachable(
          this.dbModerator
            .getAllByIndex('room-id', room.id)
            .pipe(map((mods) => new Set(mods.map((m) => m.accountId)))),
          this.moderatorService.get(room.id).pipe(
            map((mods) => new Set(mods.map((m) => m.accountId))),
            tap((modsSet) =>
              this.dbModerator
                .createOrUpdateMany(
                  [...modsSet].map((accountId) => ({
                    value: new Moderator({ roomId: room.id, accountId }),
                  })),
                )
                .subscribe(),
            ),
          ),
        );
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
        return onlineState.refreshWhenReachable(
          this.dbComment.getAllByIndex('room-id', room.id),
          this.commentService
            .getComments(room.id)
            .pipe(
              tap((data) =>
                this.dbComment
                  .createOrUpdateMany(data.map((value) => ({ value })))
                  .subscribe(),
              ),
            ),
        );
      }),
      distinctUntilChanged(),
      shareReplay(),
    );
  }

  setRoomShortId(roomShortId: string) {
    this.updateRoomShortId$.next(roomShortId);
  }

  getCurrentRole(): UserRole {
    let role: RoomAccessRole = null;
    this.role$.subscribe((r) => (role = r)).unsubscribe();
    if (role === 'Creator') return UserRole.CREATOR;
    if (role === 'Moderator') return UserRole.EXECUTIVE_MODERATOR;
    if (role === 'Participant') return UserRole.PARTICIPANT;
    return null;
  }
}
