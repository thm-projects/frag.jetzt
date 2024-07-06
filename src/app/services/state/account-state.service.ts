import { Injectable } from '@angular/core';
import {
  Observable,
  Subject,
  distinctUntilChanged,
  filter,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { UserRole } from 'app/models/user-roles.enum';
import { GptService } from '../http/gpt.service';
import { OnlineStateService } from './online-state.service';
import {
  MotdDialogRequest,
  sendEvent,
} from 'app/utils/service-component-events';
import { AppStateService } from './app-state.service';
import { EventService } from '../util/event.service';
import { InitService } from '../util/init.service';
import { RoomAccess } from 'app/base/db/models/db-room-access.model';
import { ReadMotd } from 'app/base/db/models/db-read-motd';
import { dataService } from 'app/base/db/data-service';
import { user, user$ } from 'app/user/state/user';

@Injectable({
  providedIn: 'root',
})
export class AccountStateService {
  readonly access$: Observable<RoomAccess[]>;
  readonly readMotds$: Observable<ReadMotd[]>;
  readonly unreadMotds$: Observable<boolean>;
  readonly gptConsented$: Observable<boolean>;
  private readonly updateAccess$ = new Subject<boolean>();
  private readonly updateReadMotds$ = new Subject<boolean>();
  private readonly updateGptConsented$ = new Subject<boolean>();

  constructor(
    private gptService: GptService,
    private onlineState: OnlineStateService,
    private appState: AppStateService,
    private eventService: EventService,
    private initService: InitService,
  ) {
    this.access$ = merge(user$, this.updateAccess$).pipe(
      switchMap((value) => {
        const isUpdate = typeof value === 'boolean';
        const account = user();
        if (!account) {
          return of(null);
        }
        const local = dataService.roomAccess.getAllByIndex(
          'user-id',
          account.id,
        );
        return isUpdate ? local : local.pipe(startWith(null));
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.readMotds$ = merge(user$, this.updateReadMotds$).pipe(
      switchMap(() => {
        const account = user();
        if (!account) {
          return of(null);
        }
        return dataService.readMotd
          .getAllByIndex('user-id', account.id)
          .pipe(startWith(null));
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.unreadMotds$ = merge(this.appState.motd$, this.readMotds$).pipe(
      map(() => {
        const motds = this.appState.getCurrentMotds();
        if (!motds) {
          return false;
        }
        const readMotds = this.getCurrentReadMotds();
        if (!readMotds) {
          return false;
        }
        const readSet = new Set(readMotds.map((r) => r.motdId));
        return motds.some((m) => !readSet.has(m.id));
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    this.gptConsented$ = merge(user$, this.updateGptConsented$).pipe(
      switchMap((v) => {
        if (typeof v === 'boolean') {
          return of(v);
        }
        if (!v) {
          return of(undefined);
        }
        return this.onlineState.refreshWhenReachable(
          of(null),
          this.gptService.getConsentState(),
        );
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );
    // Side effects
    // Read Motds => motd dialog
    this.initService.init$.subscribe(() => {
      this.unreadMotds$
        .pipe(
          filter((unread) => unread),
          take(1),
        )
        .subscribe(() => {
          sendEvent(
            this.eventService,
            new MotdDialogRequest(this.appState.getCurrentMotds()),
          );
        });
    });
  }

  isInitialized(): boolean {
    return user() !== undefined;
  }

  getCurrentReadMotds(): ReadMotd[] {
    let readMotds = null;
    this.readMotds$.subscribe((r) => (readMotds = r)).unsubscribe();
    return readMotds;
  }

  setAccess(
    roomShortId: string,
    roomId: string,
    role: UserRole,
  ): Observable<void> {
    const userId = user()?.id;
    if (!userId) {
      throw new Error('setAccess: User not logged in');
    }
    return dataService.roomAccess
      .createOrUpdate(
        new RoomAccess({
          userId,
          roomId,
          roomShortId,
          role:
            role === UserRole.CREATOR
              ? 'Creator'
              : role > UserRole.PARTICIPANT
                ? 'Moderator'
                : 'Participant',
          lastAccess: new Date(),
        }),
      )
      .pipe(
        tap(() => this.updateAccess$.next(true)),
        map(() => undefined),
      );
  }

  updateAccess(roomShortId: string) {
    const userId = user()?.id;
    if (!userId) {
      throw new Error('updateAccess: User not logged in');
    }
    dataService.roomAccess
      .get([userId, roomShortId])
      .pipe(
        switchMap((v) => {
          if (!v) {
            return of();
          }
          v.lastAccess = new Date();
          return dataService.roomAccess.createOrUpdate(v);
        }),
      )
      .subscribe(() => this.updateAccess$.next(true));
  }

  removeAccess(roomShortId: string) {
    const userId = user().id;
    if (!userId) {
      throw new Error('removeAccess: User not logged in');
    }
    dataService.roomAccess
      .delete([userId, roomShortId])
      .subscribe(() => this.updateAccess$.next(true));
  }

  getAccess(roomShortId: string) {
    const userId = user()?.id;
    if (!userId) {
      throw new Error('getAccess: User not logged in');
    }
    let current: RoomAccess[] = null;
    this.access$.subscribe((data) => (current = data)).unsubscribe();
    current = current || [];
    const data = current.find(
      (r) => r.roomShortId === roomShortId && r.userId === userId,
    );
    return data;
  }

  hasAccess(roomShortId: string, role: UserRole) {
    if (role === UserRole.PARTICIPANT) {
      return true;
    }
    const accessRole = this.getAccess(roomShortId)?.role;
    const isCreator = accessRole === 'Creator';
    const isModerator = accessRole === 'Moderator';
    if (role === UserRole.CREATOR) return isCreator;
    if (role === UserRole.EXECUTIVE_MODERATOR) return isCreator || isModerator;
    return false;
  }

  ensureAccess(roomShortId: string, roomId: string, role: UserRole) {
    if (!this.getAccess(roomShortId)) {
      this.setAccess(roomShortId, roomId, role).subscribe();
      return true;
    }
    return false;
  }

  readMotds(motdIds: string[]) {
    const userId = user()?.id;
    if (!userId) {
      throw new Error('readMotds: User not logged in');
    }
    dataService.readMotd
      .createOrUpdateMany(
        motdIds.map((motdId) => ({ value: new ReadMotd({ motdId, userId }) })),
      )
      .subscribe(() => this.updateReadMotds$.next(true));
  }

  unreadMotd(motdId: string) {
    const userId = user()?.id;
    if (!userId) {
      throw new Error('unreadMotd: User not logged in');
    }
    dataService.readMotd
      .delete([motdId, userId])
      .subscribe(() => this.updateReadMotds$.next(true));
  }

  updateGPTConsentState(result: boolean) {
    const consentState = Boolean(result);

    this.gptService
      .updateConsentState(consentState)
      .pipe(tap((data) => this.updateGptConsented$.next(data)))
      .subscribe();
  }
}
