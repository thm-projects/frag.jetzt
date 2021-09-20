import { EventEmitter, Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../util/event.service';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Motd } from '../../models/motd';
import { MotdList } from '../../models/motd-list';

@Injectable({
  providedIn: 'root'
})
export class MotdService extends BaseHttpService {

  private list: MotdList;
  private dialogTrigger = new EventEmitter<void>();
  private hasNewMessages = false;
  private newMessageTrigger = new EventEmitter<boolean>();

  constructor(
    private http: HttpClient,
    private eventService: EventService,
    private authService: AuthenticationService
  ) {
    super();
    setInterval(() => {
      this.checkNewMessage();
    }, 1_800_000);
  }

  public checkNewMessage(runnable?: () => void): void {
    this.getList().subscribe(e => {
      this.validateNewMessage(e);
      if (runnable && this.hasNewMessages) {
        runnable();
      }
    });
  }

  public onDialogRequest(): Observable<void> {
    return new Observable<void>(e => {
      this.dialogTrigger.subscribe(() => {
        e.next();
      });
    });
  }

  public onNewMessage(run?: boolean): Observable<boolean> {
    return new Observable<boolean>(e => {
      this.newMessageTrigger.subscribe(b => {
        e.next(b);
      });
      if (run) {
        e.next(this.hasNewMessages);
      }
      this.checkNewMessage();
    });
  }

  public requestDialog(): void {
    this.dialogTrigger.emit();
  }

  public getOld(): Observable<Motd[]> {
    if (!this.authService.getUser()) {
      return new Observable<Motd[]>(e => e.next([]));
    }
    return this.http.post<Motd[]>('/api/motds/find', {
      properties: {},
      externalFilters: {
        before: new Date().getTime()
      }
    }).pipe(
      catchError((error: any): Observable<any> => {
        return new Observable<any>(e => e.next([]));
      })
    );
  }

  public getNew(): Observable<Motd[]> {
    if (!this.authService.getUser()) {
      return new Observable<Motd[]>(e => e.next([]));
    }
    return this.http.post<Motd[]>('/api/motds/find', {
      properties: {},
      externalFilters: {
        activeAt: new Date().getTime()
      }
    }).pipe(
      catchError((error: any): Observable<any> => {
        return new Observable<any>(e => e.next([]));
      })
    );
  }

  public getList(): Observable<MotdList> {
    return new Observable<MotdList>(e => {
      this.getOld().subscribe(o => {
        this.getNew().subscribe(n => {
          this.list = new MotdList(n, o);
          this.validateNewMessage(this.list);
          e.next(this.list);
        });
      });
    });
  }

  private validateNewMessage(list: MotdList): void {
    if (list.containsUnreadMessage()) {
      if (!this.hasNewMessages) {
        this.hasNewMessages = true;
        this.newMessageTrigger.emit(this.hasNewMessages);
      }
    } else {
      if (this.hasNewMessages) {
        this.hasNewMessages = false;
        this.newMessageTrigger.emit(this.hasNewMessages);
      }
    }
  }

}
