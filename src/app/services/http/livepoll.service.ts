import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { RoomService } from './room.service';
import { BehaviorSubject, catchError, map, Observable, tap } from 'rxjs';
import { LivepollSession } from 'app/models/livepoll-session';
import { verifyInstance } from 'app/utils/ts-utils';
import { BaseHttpService } from './base-http.service';
import { LivepollVote } from 'app/models/livepoll-vote';
import { SessionService } from '../util/session.service';
import { UserRole } from '../../models/user-roles.enum';
import { Overlay } from '@angular/cdk/overlay';
import {
  LivepollDialogRequest,
  LivepollDialogResponse,
  callServiceEvent,
} from 'app/utils/service-component-events';
import { EventService } from '../util/event.service';

export interface LivepollSessionCreateAPI {
  template: string;
  title: string | null;
  resultVisible: boolean;
  viewsVisible: boolean;
  roomId: string;
  customEntries: {
    icon: string;
    text: string;
  }[];
}

export interface LivepollSessionPatchAPI {
  active: boolean;
  title: string | null;
  resultVisible: boolean;
  viewsVisible: boolean;
  paused: boolean;
  customEntries: {
    icon: string;
    text: string;
  }[];
}

enum LivepollDialogState {
  Closed,
  Opening,
  Open,
}

export enum LivepollEventType {
  Create,
  Delete,
  Patch,
}

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class LivepollService extends BaseHttpService {
  public static readonly dialogDefaults: MatDialogConfig = {
    width: '700px',
    maxWidth: '100vw',
  };
  private static readonly livepollEventEmitter: EventEmitter<{
    session: LivepollSession;
    changes: Partial<LivepollSession>;
    type: LivepollEventType;
  }> = new EventEmitter();
  private readonly _dialogState: BehaviorSubject<LivepollDialogState> =
    new BehaviorSubject<LivepollDialogState>(LivepollDialogState.Closed);

  constructor(
    public readonly http: HttpClient,
    public readonly roomService: RoomService,
    public readonly dialog: MatDialog,
    public readonly overlay: Overlay,
    private readonly eventService: EventService,
  ) {
    super();
  }

  get isOpen(): boolean {
    return this._dialogState.value > LivepollDialogState.Closed;
  }

  get listener(): Observable<any> {
    return LivepollService.livepollEventEmitter;
  }

  findByRoomId(roomId: string): Observable<LivepollSession[]> {
    return this.http
      .post<LivepollSession[]>('/api/livepoll/find', {
        properties: {
          roomId,
        },
      })
      .pipe(
        tap(() => ''),
        catchError(
          this.handleError<LivepollSession[]>(
            `get bonus token by roomid = ${roomId}`,
          ),
        ),
      );
  }

  create(
    livepollSessionCreateAPI: LivepollSessionCreateAPI,
  ): Observable<LivepollSession> {
    return this.http
      .post<LivepollSession>(
        '/api/livepoll/session',
        livepollSessionCreateAPI,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((e) => verifyInstance(LivepollSession, e)),
        catchError(this.handleError<LivepollSession>('create')),
      );
  }

  delete(livepollId: string): Observable<LivepollSession> {
    return this.update(livepollId, {
      active: false,
      paused: true,
    });
  }

  update(livepollId: string, changes: Partial<LivepollSessionPatchAPI>) {
    return this.http
      .patch<LivepollSession>(
        '/api/livepoll/session/' + livepollId,
        changes,
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        map((e) => verifyInstance(LivepollSession, e)),
        catchError(this.handleError<LivepollSession>('update')),
      );
  }

  getVote(livepollId: string): Observable<LivepollVote> {
    return this.http
      .get<LivepollVote>('/api/livepoll/vote/' + livepollId, httpOptions)
      .pipe(
        tap(() => ''),
        map((e) => verifyInstance(LivepollVote, e)),
        catchError(this.handleError<LivepollVote>('getVote')),
      );
  }

  makeVote(livepollId: string, voteIndex: number): Observable<void> {
    return this.http
      .post<never>(
        '/api/livepoll/vote/' + livepollId,
        { voteIndex },
        httpOptions,
      )
      .pipe(
        tap(() => ''),
        catchError(this.handleError<void>('makeVote')),
      );
  }

  deleteVote(livepollId: string): Observable<void> {
    return this.http
      .delete<never>('/api/livepoll/vote/' + livepollId, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<void>('deleteVote')),
      );
  }

  getResults(livepollId: string): Observable<number[]> {
    return this.http
      .get<number[]>('/api/livepoll/votes/' + livepollId, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<number[]>('getVote')),
      );
  }

  setPaused(livepollId: string, paused: boolean): Observable<LivepollSession> {
    return this.update(livepollId, {
      paused,
    });
  }

  open(sessionService: SessionService) {
    if (!this.isOpen) {
      switch (sessionService.currentRole) {
        case UserRole.PARTICIPANT:
          if (sessionService.currentLivepoll?.active) {
            this.openDialog(sessionService);
          } else {
            console.error(
              `Live Poll Dialog cannot be opened as participant, participant cannot create Live Polls either`,
            );
          }
          break;
        case UserRole.EDITING_MODERATOR:
        case UserRole.EXECUTIVE_MODERATOR:
        case UserRole.CREATOR:
          if (sessionService.currentLivepoll) {
            this.openDialog(sessionService);
          } else {
            this.openCreateDialog(sessionService);
          }
          break;
      }
    } else {
      if (this._dialogState.value === LivepollDialogState.Opening) {
        console.warn('Live Poll Dialog is already opening.');
      } else {
        console.error('Live Poll Dialog already open!');
      }
    }
  }

  emitEvent(
    session: LivepollSession,
    changes: Partial<LivepollSession>,
    type: LivepollEventType,
  ) {
    LivepollService.livepollEventEmitter.emit({
      type,
      changes,
      session,
    });
  }

  resetResults(livepollId: string) {
    return this.http
      .delete<never>('/api/livepoll/reset/' + livepollId, httpOptions)
      .pipe(
        tap(() => ''),
        catchError(this.handleError<number[]>('deleteVotes')),
      );
  }

  private onNextEvent(type: LivepollEventType): Observable<LivepollSession> {
    return new Observable<LivepollSession>((subscriber) => {
      const subscription = LivepollService.livepollEventEmitter.subscribe(
        (data) => {
          if (data.type === type) {
            if (data.type === type) {
              subscriber.next();
              subscription.unsubscribe();
              subscriber.unsubscribe();
            }
          }
        },
      );
    });
  }

  private openDialog(sessionService: SessionService) {
    this._dialogState.next(LivepollDialogState.Opening);
    if (!sessionService.currentLivepoll) {
      console.error(`session does not have Live Poll`);
      return;
    }
    const cachedLivepollSession = sessionService.currentLivepoll;
    const config = {
      data: {
        session: sessionService.currentLivepoll,
        isProduction: true,
      },
      ...LivepollService.dialogDefaults,
    };
    callServiceEvent<LivepollDialogResponse, LivepollDialogRequest>(
      this.eventService,
      new LivepollDialogRequest('dialog', config),
    ).subscribe((response) => {
      const dialogRef = response.dialogRef;
      dialogRef.afterClosed().subscribe((result) => {
        switch (result?.reason) {
          case 'delete':
            this.delete(sessionService.currentLivepoll.id).subscribe(() => {
              this._dialogState.next(LivepollDialogState.Closed);
              this.openSummary(sessionService, cachedLivepollSession);
            });
            break;
          case 'reset':
            this.delete(sessionService.currentLivepoll.id).subscribe(() => {
              this._dialogState.next(LivepollDialogState.Closed);
              this.open(sessionService);
            });
            break;
          case 'closedAsCreator':
            this._dialogState.next(LivepollDialogState.Closed);
            this.openSummary(sessionService, cachedLivepollSession);
            break;
          case 'closedAsParticipant':
          case 'close':
          default:
            break;
        }
        this._dialogState.next(LivepollDialogState.Closed);
      });
      dialogRef.afterOpened().subscribe(() => {
        this._dialogState.next(LivepollDialogState.Open);
      });
    });
  }

  private openCreateDialog(sessionService: SessionService) {
    this._dialogState.next(LivepollDialogState.Opening);
    const config = {
      data: '',
      ...LivepollService.dialogDefaults,
    };
    callServiceEvent<LivepollDialogResponse, LivepollDialogRequest>(
      this.eventService,
      new LivepollDialogRequest('create', config),
    ).subscribe((response) => {
      const dialogRef = response.dialogRef;
      dialogRef.afterClosed().subscribe((data) => {
        // data
        // ? creator wants to create a live poll
        // : creator closed dialog
        if (!data) {
          this._dialogState.next(LivepollDialogState.Closed);
          return;
        }
        this.onNextEvent(LivepollEventType.Create).subscribe(() => {
          this._dialogState.next(LivepollDialogState.Closed);
          this.open(sessionService);
        });
        const subscription = this.create(data).subscribe(() => {
          subscription.unsubscribe();
        });
      });
      dialogRef.afterOpened().subscribe(() => {
        this._dialogState.next(LivepollDialogState.Open);
      });
    });
  }

  private openSummary(
    sessionService: SessionService,
    livepollSession: LivepollSession,
  ) {
    const config = {
      ...{ data: livepollSession },
      ...LivepollService.dialogDefaults,
    };

    callServiceEvent<LivepollDialogResponse, LivepollDialogRequest>(
      this.eventService,
      new LivepollDialogRequest('summary', config),
    ).subscribe((response) => {
      const dialogRef = response.dialogRef;
      dialogRef.afterClosed().subscribe(() => {
        this._dialogState.next(LivepollDialogState.Closed);
      });
    });
  }
}
