import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SessionService } from '../util/session.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BaseHttpService } from './base-http.service';
import { LivepollSession } from '../../models/livepoll-session';
import { LivepollCreateComponent } from '../../components/shared/_dialogs/livepoll-create/livepoll-create.component';
import { LivepollConfiguration } from '../../models/livepoll-configuration';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

const httpOptions = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

type LivepollSessionAPI = Pick<
  LivepollSession,
  | 'active'
  | 'title'
  | 'resultVisible'
  | 'viewsVisible'
  | 'id'
  | 'roomId'
  | 'template'
  | 'createdAt'
>;

@Injectable({
  providedIn: 'root'
})
export class LivepollService extends BaseHttpService {
  private apiUrl = {
    base: '/api',
    livepoll: '/livepoll'
  };

  constructor(
    public readonly dialog: MatDialog,
    public readonly sessionService: SessionService,
    public readonly http: HttpClient
  ) {
    super();
  }

  create() {
    const dialogInstance: MatDialogRef<LivepollCreateComponent, LivepollConfiguration> = this.dialog
      .open(LivepollCreateComponent, {});
    dialogInstance.afterClosed().subscribe(event => {
      if (event) {
        this.createSession({
          title: event.title,
          viewsVisible: event.isViewsVisible,
          resultVisible: event.isResultVisible,
          roomId: this.sessionService.currentRoom.id,
          template: event.template + ''
        }).subscribe(response => {
          console.log(response);
        });
      }
    });
  }

  createSession(
    session: Omit<LivepollSessionAPI, any>
  ): Observable<LivepollSession> {
    const connectionUrl = this.apiUrl.base + this.apiUrl.livepoll + '/';
    return this.http
      .post<LivepollSession>(connectionUrl, session, httpOptions)
      .pipe(
        tap((_) => ''),
        catchError(this.handleError<LivepollSession>('createSession'))
      );
  }

}
