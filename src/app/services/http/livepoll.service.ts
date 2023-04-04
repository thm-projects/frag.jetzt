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
  private static readonly livepollEventEmitter: EventEmitter<any> =
    new EventEmitter<any>();
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
    // for backtracking the caller
    console.error('trace');
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
      console.error(`Live Poll Dialog state is 'Opened' or 'Opening'`);
    }
  }

  emitEvent(changes: Partial<LivepollSession>) {
    LivepollService.livepollEventEmitter.emit(changes);
  }

  private openDialog(session: SessionService) {
    this._dialogState.next(LivepollDialogState.Opening);
    if (session.currentLivepoll) {
      const dialogRef: MatDialogRef<
        LivepollDialogComponent,
        LivepollDialogResponseData
      > = this.dialog.open<LivepollDialogComponent>(LivepollDialogComponent, {
        data: {
          session: session.currentLivepoll,
          isProduction: true,
        } as LivepollDialogInjectionData,
      });
      dialogRef.afterClosed().subscribe((result) => {
        switch (result?.reason) {
          // user wants to delete live poll
          case 'delete':
            this.delete(session.currentLivepoll.id).subscribe((res) => {
              console.log('deleted', session.currentLivepoll, result);
            });
            break;
          // user wants to create a new live poll
          case 'reset':
            this.delete(session.currentLivepoll.id).subscribe(() => {});
            break;
          // 'close' or 'undefined', user just closed dialog
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
    const dialogRef: MatDialogRef<
      LivepollCreateComponent,
      LivepollSessionCreateAPI
    > = this.dialog.open(LivepollCreateComponent, {
      data: '',
    });
    dialogRef.afterClosed().subscribe((data) => {
      if (data) {
        this.create(data).subscribe((result) => {
          if (result.id !== session.currentLivepoll.id) {
            console.error(
              `ID of live poll in session and ID of live poll in response to create don't match`,
            );
          }
          console.log(result.id, session.currentLivepoll.id);
        });
      }
      this._dialogState.next(LivepollDialogState.Closed);
    });
    dialogRef.afterOpened().subscribe(() => {
      this._dialogState.next(LivepollDialogState.Open);
    });
  }
}
