import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from '@angular/material/dialog';
import { RoomService } from './room.service';
import { BehaviorSubject, catchError, map, Observable, tap } from 'rxjs';
import { LivepollSession } from 'app/models/livepoll-session';
import { verifyInstance } from 'app/utils/ts-utils';
import { BaseHttpService } from './base-http.service';
import { LivepollVote } from 'app/models/livepoll-vote';
import { SessionService } from '../util/session.service';
import { UserRole } from '../../models/user-roles.enum';
import {
  LivepollDialogComponent,
  LivepollDialogInjectionData,
  LivepollDialogResponseData,
} from '../../components/shared/_dialogs/livepoll/livepoll-dialog/livepoll-dialog.component';
import { LivepollCreateComponent } from '../../components/shared/_dialogs/livepoll/livepoll-create/livepoll-create.component';
import { LivepollSummaryComponent } from '../../components/shared/_dialogs/livepoll/livepoll-summary/livepoll-summary.component';

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
  };
  private static readonly livepollEventEmitter: EventEmitter<{
    changes: Partial<LivepollSession>;
    type: LivepollEventType;
  }> = new EventEmitter();
  private readonly _dialogState: BehaviorSubject<LivepollDialogState> =
    new BehaviorSubject<LivepollDialogState>(LivepollDialogState.Closed);

  constructor(
    public readonly http: HttpClient,
    public readonly roomService: RoomService,
    public readonly dialog: MatDialog,
  ) {
    super();
  }

  get isOpen(): boolean {
    return this._dialogState.value > LivepollDialogState.Closed;
  }

  get listener(): Observable<any> {
    return LivepollService.livepollEventEmitter;
  }

  create(livepoll: LivepollSessionCreateAPI): Observable<LivepollSession> {
    return this.http
      .post<LivepollSession>('/api/livepoll/session', livepoll, httpOptions)
      .pipe(
        tap(() => ''),
        map((e) => verifyInstance(LivepollSession, e)),
        catchError(this.handleError<LivepollSession>('create')),
      );
  }

  delete(id: string): Observable<LivepollSession> {
    return this.update(id, {
      active: false,
      paused: true,
    });
  }

  update(id: string, livepoll: Partial<LivepollSessionPatchAPI>) {
    return this.http
      .patch<LivepollSession>(
        '/api/livepoll/session/' + id,
        livepoll,
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

  setPaused(id: string, paused: boolean): Observable<LivepollSession> {
    return this.update(id, {
      paused,
    });
  }

  open(session: SessionService) {
    if (!this.isOpen) {
      switch (session.currentRole) {
        case UserRole.PARTICIPANT:
          if (session.currentLivepoll?.active) {
            this.openDialog(session);
          } else {
            console.error(
              `Live Poll Dialog cannot be opened as participant, participant cannot create Live Polls either`,
            );
          }
          break;
        case UserRole.EDITING_MODERATOR:
        case UserRole.EXECUTIVE_MODERATOR:
        case UserRole.CREATOR:
          if (session.currentLivepoll) {
            this.openDialog(session);
          } else {
            this.openCreateDialog(session);
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

  emitEvent(changes: Partial<LivepollSession>, type: LivepollEventType) {
    console.warn('emitEvent', changes, LivepollEventType[type]);
    LivepollService.livepollEventEmitter.emit({ changes, type });
  }

  private openDialog(session: SessionService) {
    this._dialogState.next(LivepollDialogState.Opening);
    if (session.currentLivepoll) {
      const cachedLivepollSession = session.currentLivepoll;
      const config = {
        ...{
          data: {
            session: session.currentLivepoll,
            isProduction: true,
          } as LivepollDialogInjectionData,
        },
        ...LivepollService.dialogDefaults,
      };
      const dialogRef: MatDialogRef<
        LivepollDialogComponent,
        LivepollDialogResponseData
      > = this.dialog.open<LivepollDialogComponent>(
        LivepollDialogComponent,
        config,
      );
      dialogRef.afterClosed().subscribe((result) => {
        switch (result?.reason) {
          case 'delete':
            this.delete(session.currentLivepoll.id).subscribe((res) => {
              this._dialogState.next(LivepollDialogState.Closed);
              this.openSummary(session, cachedLivepollSession);
            });
            break;
          case 'reset':
            this.delete(session.currentLivepoll.id).subscribe(() => {
              this._dialogState.next(LivepollDialogState.Closed);
              this.open(session);
            });
            break;
          case 'closedAsCreator':
            this._dialogState.next(LivepollDialogState.Closed);
            this.openSummary(session, cachedLivepollSession);
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
    } else {
      console.error(`session does not have Live Poll`);
    }
  }

  private openCreateDialog(session: SessionService) {
    this._dialogState.next(LivepollDialogState.Opening);
    const config = {
      ...{
        data: '',
      },
      ...LivepollService.dialogDefaults,
    };
    const dialogRef: MatDialogRef<
      LivepollCreateComponent,
      LivepollSessionCreateAPI
    > = this.dialog.open(LivepollCreateComponent, config);
    dialogRef.afterClosed().subscribe((data) => {
      // data
      // ? creator wants to create a live poll
      // : creator closed dialog
      if (data) {
        this.create(data).subscribe((result) => {
          console.warn(result, session.currentLivepoll);
          if (result?.id === session.currentLivepoll?.id) {
            this._dialogState.next(LivepollDialogState.Closed);
            this.open(session);
          } else {
            console.error(
              `ID of live poll in session and ID of live poll in response to create don't match`,
            );
          }
        });
      } else {
        this._dialogState.next(LivepollDialogState.Closed);
      }
    });
    dialogRef.afterOpened().subscribe(() => {
      this._dialogState.next(LivepollDialogState.Open);
    });
  }

  private openSummary(
    session: SessionService,
    livepollSession: LivepollSession,
  ) {
    const config = {
      ...{ data: livepollSession },
      ...LivepollService.dialogDefaults,
    };
    const dialogRef: MatDialogRef<LivepollSummaryComponent> = this.dialog.open(
      LivepollSummaryComponent,
      config,
    );
    dialogRef.afterClosed().subscribe(() => {
      this._dialogState.next(LivepollDialogState.Closed);
    });
  }
}
