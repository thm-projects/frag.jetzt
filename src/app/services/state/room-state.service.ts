import { Injectable } from '@angular/core';
import { Room } from 'app/models/room';
import { UserRole } from 'app/models/user-roles.enum';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  filter,
  forkJoin,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import { AccountStateService } from './account-state.service';
import { RoomAccessRole } from '../persistence/lg/db-room-access.service';

@Injectable({
  providedIn: 'root',
})
export class RoomStateService {
  readonly roomShortId$: Observable<string>;
  readonly room$: Observable<Room>;
  readonly role$: Observable<RoomAccessRole>;
  readonly moderators$: Observable<Set<string>>;
  readonly comments$: Observable<Comment>;
  private readonly updateRoomShortId$ = new BehaviorSubject<string>(null);

  constructor(private accountState: AccountStateService) {
    this.roomShortId$ = this.updateRoomShortId$;
    this.role$ = this.roomShortId$.pipe(
      startWith(null),
      switchMap((shortId) =>
        combineLatest([
          accountState.user$.pipe(filter((v) => Boolean(v))),
          accountState.access$.pipe(filter((v) => Boolean(v))),
        ]).pipe(
          take(1),
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
      switchMap((shortId) => {
        if (!shortId) {
          return of(null);
        }
        return; //
      }),
    );
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
