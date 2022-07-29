import { EventEmitter, Injectable } from '@angular/core';
import { BaseHttpService } from './base-http.service';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../util/event.service';
import { AuthenticationService } from './authentication.service';
import { forkJoin, Observable, of, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Motd } from '../../models/motd';
import { MotdList } from '../../models/motd-list';
import { SyncFence } from '../../utils/SyncFence';
import { OnboardingService } from '../util/onboarding.service';

interface MotdAPI {
  startTimestamp: Date;
  endTimestamp: Date;
  messages: { [key: string]: { language: string; message: string } };
}

@Injectable({
  providedIn: 'root'
})
export class MotdService extends BaseHttpService {

  public static DEBUG: boolean = false;

  private list: MotdList;
  private dialogTrigger = new EventEmitter<void>();
  private hasNewMessages = false;
  private newMessageTrigger = new EventEmitter<boolean>();

  constructor(
    private http: HttpClient,
    private eventService: EventService,
    private onboardingService: OnboardingService,
    private authService: AuthenticationService
  ) {
    super();
    // eslint-disable-next-line prefer-const
    let subscription;
    const fence = new SyncFence(2, () => {
      const checkNew = () => {
        if (!this.authService.getUser()) {
          fence.unresolveCondition(0);
          return;
        }
        setTimeout(() => subscription.unsubscribe());
        this.checkNewMessage(() => this.requestDialog());
      };
      checkNew();
      setInterval(checkNew, 1_800_000);
    });
    subscription = this.authService.watchUser.subscribe(user => {
      if (!user) {
        fence.unresolveCondition(0);
      } else {
        fence.resolveCondition(0);
      }
    });
    this.onboardingService.onFinishTour().subscribe(() => fence.resolveCondition(1));
    if (MotdService.DEBUG) {
      console.error('MotdService.DEBUG MUST be \'false\' for production!');
    }
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
    });
  }

  public requestDialog(): void {
    this.dialogTrigger.emit();
  }

  public getList(): Observable<MotdList> {
    return new Observable<MotdList>(e => {
      forkJoin([this.getMOTDs(false), this.getMOTDs(true)])
        .subscribe(([o, n]) => {
          this.list = new MotdList(n, o);
          if (MotdService.DEBUG) {
            this.list.messages.push(new Motd(
              'test',
              new Date('3 October 2021'),
              new Date(),
              true,
              false,
              {
                en: { message: 'test' },
                de: { message: 'test' },
                fr: { message: 'test' },
              },
            ));
          }
          this.validateNewMessage(this.list);
          e.next(this.list);
        });
    });
  }

  createMOTD(motd: MotdAPI): Observable<MotdAPI> {
    return this.http.post<MotdAPI>('/api/motds/', motd).pipe(
      tap(_ => ''),
      catchError(this.handleError<MotdAPI>('createMOTD')),
    );
  }

  private getMOTDs(newMessages: boolean): Observable<Motd[]> {
    if (!this.authService.getUser()) {
      return of([]);
    }
    const externalFilters = {};
    externalFilters[newMessages ? 'activeAt' : 'before'] = new Date().getTime();
    return this.http.post<Motd[]>('/api/motds/find', {
      properties: {},
      externalFilters
    }).pipe(
      tap(_ => ''),
      catchError(_ => of([]))
    );
  }

  private checkNewMessage(runnable?: () => void): void {
    this.getList().subscribe(e => {
      this.validateNewMessage(e);
      if (runnable && this.hasNewMessages) {
        runnable();
      }
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
