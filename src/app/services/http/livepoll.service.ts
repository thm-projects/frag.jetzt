import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UserRole } from '../../models/user-roles.enum';
import { LivepollCreateComponent } from '../../components/shared/_dialogs/livepoll/livepoll-create/livepoll-create.component';
import { LivepollDialogComponent } from '../../components/shared/_dialogs/livepoll/livepoll-dialog/livepoll-dialog.component';
import { RoomService } from './room.service';
import { catchError, map, Observable, tap } from 'rxjs';
import { LivepollSession } from 'app/models/livepoll-session';
import { verifyInstance } from 'app/utils/ts-utils';
import { BaseHttpService } from './base-http.service';
import { take } from 'rxjs/operators';
import { LivepollVote } from 'app/models/livepoll-vote';

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
  public isOpen: boolean = false;
  constructor(
    public readonly http: HttpClient,
    public readonly roomService: RoomService,
    public readonly dialog: MatDialog,
  ) {
    super();
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

  open(
    userRole: UserRole,
    hasActiveLivepoll: boolean,
    session: LivepollSession,
  ) {
    if (this.isOpen) {
      return;
    }
    switch (userRole) {
      case UserRole.PARTICIPANT:
        if (hasActiveLivepoll) {
          const instance = this.dialog.open(
            LivepollDialogComponent,
            LivepollService.dialogDefaults,
          );
          this.isOpen = true;
          instance.componentInstance.initFrom(session);
          instance
            .afterClosed()
            .pipe(take(1))
            .subscribe(() => (this.isOpen = false));
          instance.componentInstance.closeEmitter
            .pipe(take(1))
            .subscribe(() => {
              instance.close();
              this.isOpen = false;
            });
        }
        break;
      case UserRole.EDITING_MODERATOR:
      case UserRole.EXECUTIVE_MODERATOR:
      case UserRole.CREATOR:
        if (hasActiveLivepoll) {
          const instance = this.dialog.open(
            LivepollDialogComponent,
            LivepollService.dialogDefaults,
          );
          this.isOpen = true;
          instance.componentInstance.initFrom(session);
          instance
            .afterClosed()
            .pipe(take(1))
            .subscribe(() => (this.isOpen = false));
          instance.componentInstance.closeEmitter
            .pipe(take(1))
            .subscribe(() => {
              instance.close();
              this.isOpen = false;
            });
        } else {
          const instance = this.dialog.open(
            LivepollCreateComponent,
            LivepollService.dialogDefaults,
          );
          this.isOpen = true;
          instance
            .afterClosed()
            .pipe(take(1))
            .subscribe(() => (this.isOpen = false));
        }
        break;
    }
  }

  delete(id: string) {}

  setActive(id: string, active: boolean): Observable<LivepollSession> {
    return this.update(id, {
      paused: active,
    });
  }
}
