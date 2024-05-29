import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  LivepollTemplateContext,
  templateEntries,
} from '../../../../../models/livepoll-template';
import { Observable, ReplaySubject, of, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../../../../services/util/session.service';
import {
  LivepollService,
  LivepollSessionPatchAPI,
} from '../../../../../services/http/livepoll.service';
import { LivepollSession } from '../../../../../models/livepoll-session';
import { clone, UUID } from 'app/utils/ts-utils';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  ConfirmDialogAction,
  ConfirmDialogType,
  LivepollConfirmationDialogComponent,
} from '../livepoll-confirmation-dialog/livepoll-confirmation-dialog.component';
import { map, take } from 'rxjs/operators';
import { LivepollVote } from '../../../../../models/livepoll-vote';
import { WsLivepollService } from '../../../../../services/websockets/ws-livepoll.service';
import { NotificationService } from '../../../../../services/util/notification.service';
import { ActiveUserService } from 'app/services/http/active-user.service';
import { LivepollComponentUtility } from '../livepoll-component-utility';
import { prettyPrintDate } from 'app/utils/date';
import { RoomDataService } from '../../../../../services/util/room-data.service';
import { DeviceStateService } from 'app/services/state/device-state.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { LivepollPeerInstructionWindowComponent } from '../livepoll-peer-instruction/livepoll-peer-instruction-window/livepoll-peer-instruction-window.component';
import {
  ROOM_ROLE_MAPPER,
  RoomStateService,
} from 'app/services/state/room-state.service';
import { UserRole } from 'app/models/user-roles.enum';

export enum PeerInstructionPhase {
  Undefined,
  FirstPass,
  SecondPass,
}

export interface LivepollDialogInjectionData {
  session: LivepollSession;
  isProduction: boolean;
}

export type LivepollDialogResponseReason =
  | 'close'
  | 'delete'
  | 'reset'
  | 'closedAsParticipant'
  | 'peerInstructionPhase1'
  | 'closedAsCreator';

export interface LivepollDialogResponseData {
  session: LivepollSession;
  reason: LivepollDialogResponseReason;
}

export interface LivepollOptionEntry {
  index: number;
  symbol: string;
}

interface MessagePayload {
  votes: number[];
  userCount: number;
}

@Component({
  selector: 'app-livepoll-dialog',
  templateUrl: './livepoll-dialog.component.html',
  styleUrls: [
    './livepoll-dialog.component.scss',
    '../livepoll-create/livepoll-create.component.scss',
    '../livepoll-common.scss',
  ],
  animations: [...LivepollComponentUtility.animation],
})
export class LivepollDialogComponent
  implements OnInit, OnDestroy, AfterViewInit {
  @Input() public livepollSession: LivepollSession | undefined;
  @Input() public template: LivepollTemplateContext;
  @Input() public isProduction: boolean = false;
  @ViewChild('markdownContainer')
  markdownContainerRef: ElementRef<HTMLDivElement>;
  isMobile = false;
  currentRole = UserRole.PARTICIPANT;
  public translateKey: string = 'common';
  public votes: number[] = [];
  public livepollVote: LivepollVote;
  public userCount: number = 1;
  public options: LivepollOptionEntry[] | undefined;
  public isConclusion: boolean = false;
  public waitForSocket: boolean = false;
  public rowHeight: number;
  public archive: LivepollSession[];
  public participantCount: string = '0';
  protected is2ndPhasePeerInstruction: boolean = false;
  private voteQuery: number = -1;
  private _destroyer = new ReplaySubject(1);
  private lastSession: LivepollSession;

  constructor(
    public readonly translationService: TranslateService,
    public readonly http: HttpClient,
    public readonly session: SessionService,
    public readonly livepollService: LivepollService,
    public readonly wsLivepollService: WsLivepollService,
    public readonly dialog: MatDialog,
    public readonly dialogRef: MatDialogRef<LivepollDialogResponseData>,
    public readonly notification: NotificationService,
    private readonly activeUser: ActiveUserService,
    private readonly roomDataService: RoomDataService,
    @Inject(MAT_DIALOG_DATA) data: LivepollDialogInjectionData,
    private appState: AppStateService,
    private roomState: RoomStateService,
    deviceState: DeviceStateService,
  ) {
    if (data) {
      this.livepollSession = data.session;
      this.isProduction = data.isProduction;
      this.lastSession = clone(this.livepollSession) as LivepollSession;
      this.template = templateEntries[this.livepollSession.template];
      const relation = this.livepollService.getPeerInstructionRelation(
        this.livepollSession,
      );
      if (relation && relation[1] === this.livepollSession.id) {
        this.is2ndPhasePeerInstruction = true;
      }
    }
    deviceState.mobile$
      .pipe(takeUntil(this._destroyer))
      .subscribe((m) => (this.isMobile = m));
    roomState.assignedRole$
      .pipe(takeUntil(this._destroyer))
      .subscribe((role) => {
        this.currentRole = ROOM_ROLE_MAPPER[role] || UserRole.PARTICIPANT;
      });
    LivepollComponentUtility.initLanguage(
      this.appState,
      this.translationService,
      this.http,
      this._destroyer,
    );
  }

  get totalVotes(): number {
    return this.votes && this.votes.length > 0
      ? this.votes.reduce((p, c) => p + c)
      : 1;
  }

  get isPaused(): boolean {
    return this.livepollSession?.paused;
  }

  ngOnInit(): void {
    if (this.livepollSession) {
      this.roomDataService
        .observeUserCount()
        .subscribe((x) => (this.participantCount = x));
      this.livepollService
        .findByRoomId(this.session.currentRoom.id)
        .subscribe((x) => {
          console.log(x);
        });
      // Template can't change, only needs to be initialized once
      this.initTemplate();
      if (this.isProduction) {
        this.livepollService.listener
          .pipe(takeUntil(this._destroyer))
          .subscribe(() => {
            if (!this.session.currentLivepoll) {
              if (this.currentRole > 0) {
                this.close('closedAsCreator');
              } else {
                this.close('closedAsParticipant');
              }
            }
          });
        // init ws.service
        this.wsLivepollService
          .getLivepollUserCountStream(this.livepollSession.id, this.currentRole)
          .pipe(takeUntil(this._destroyer))
          .subscribe((userCount) => {
            const parsed = JSON.parse(userCount.body);
            if ('UserCountChanged' in parsed) {
              this.parseWebSocketStream(
                'UserCountChanged',
                parsed['UserCountChanged'],
              );
            } else {
              this.parseWebSocketStream(
                parsed.type,
                parsed.payload,
                parsed.livepollId,
              );
            }
          });
        // get Live Poll vote of current user.
        this.livepollService
          .getVote(this.livepollSession.id)
          .subscribe((vote) => {
            this.livepollVote = vote;
          });
        // get Live Poll active users
        this.activeUser
          .getActiveLivepollUser(this.livepollSession)
          .subscribe((value) => {
            this.userCount = value[0];
          });
        // get all votes
        this.livepollService
          .getResults(this.livepollSession.id)
          .subscribe((results) => {
            this.updateVotes(results);
          });
      }
    } else {
      console.error('Live Poll is not defined.');
    }
  }

  ngAfterViewInit() {
    this.markdownContainerRef.nativeElement.scrollTop = 0;
  }

  ngOnDestroy(): void {
    this._destroyer.next(0);
  }

  public save() {
    this.saveCallback().pipe(take(1)).subscribe();
  }

  public saveCallback(): Observable<LivepollSession> {
    const data: Partial<LivepollSessionPatchAPI> = {};
    if (this.lastSession.active !== this.livepollSession.active) {
      data.active = this.livepollSession.active;
    }
    if (this.lastSession.title !== this.livepollSession.title) {
      data.title = this.livepollSession.title;
    }
    if (this.lastSession.resultVisible !== this.livepollSession.resultVisible) {
      data.resultVisible = this.livepollSession.resultVisible;
    }
    if (this.lastSession.viewsVisible !== this.livepollSession.viewsVisible) {
      data.viewsVisible = this.livepollSession.viewsVisible;
    }
    if (Object.keys(data).length < 1) {
      return of();
    }
    return this.livepollService
      .update(this.livepollSession.id, data)
      .pipe(map((d) => (this.lastSession = d)));
  }

  public pause() {
    this.livepollService
      .setPaused(this.livepollSession.id, true)
      .subscribe((livepollSession) => {
        this.livepollSession = livepollSession;
      });
  }

  public play() {
    this.livepollService
      .setPaused(this.livepollSession.id, false)
      .subscribe((livepollSession) => {
        this.livepollSession = livepollSession;
      });
  }

  public vote(i: number) {
    if (this.waitForSocket) {
      this.voteQuery = i;
    } else {
      if (this.isProduction) {
        if (this.livepollVote && this.livepollVote.voteIndex === i) {
          this.livepollService
            .deleteVote(this.livepollSession.id)
            .subscribe(() => {
              this.emitNotification('snack-bar.vote.delete');
              this.waitForSocket = true;
            });
        } else {
          this.livepollService
            .makeVote(this.livepollSession.id, i)
            .subscribe(() => {
              this.emitNotification('snack-bar.vote.make');
              this.waitForSocket = true;
            });
        }
      } else {
        ++this.votes[i];
      }
    }
  }

  public close(reason: LivepollDialogResponseReason) {
    switch (reason) {
      // delete: 'End poll'
      case 'delete':
        this.createConfirmationDialog('delete').subscribe((x) => {
          if (x === ConfirmDialogAction.Accept) {
            this.dialogRef.close({
              session: this.livepollSession,
              reason,
            });
          }
        });
        break;
      case 'reset':
        this.createConfirmationDialog('new').subscribe((x) => {
          if (x === ConfirmDialogAction.Accept) {
            this.dialogRef.close({
              session: this.livepollSession,
              reason,
            });
          }
        });
        break;
      case 'closedAsCreator':
        // when a creator closes a livepoll,
        // where the action for closing the live poll has not been made on this instance,
        // this will be called. Meaning:
        //    If there are moderators or more creators (e.g.: on different devices),
        //    the summary dialog can be opened for those roles.
        break;
      // close: user closed dialog
      // closedAsParticipant: creator closed live poll, but role of this instance is participant.
      case 'close':
      case 'closedAsParticipant':
      default:
        this.dialogRef.close({
          session: this.livepollSession,
          reason,
        });
        break;
    }
  }

  resetResults() {
    this.createConfirmationDialog('reset').subscribe((x) => {
      if (x) {
        this.livepollService
          .resetResults(this.livepollSession.id)
          .subscribe((votes) => {
            console.log(votes);
          });
      }
    });
  }

  openArchive() {
    this.livepollService
      .findByRoomId(this.session.currentRoom.id)
      .subscribe((archive) => {
        this.archive = archive.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      });
  }

  prettyPrintDate(createdAt: Date): string {
    return prettyPrintDate(createdAt, this.appState.getCurrentLanguage());
  }

  openPeerInstruction() {
    const dialogRef = this.dialog.open(LivepollPeerInstructionWindowComponent, {
      data: {
        windowContext: {
          is2ndPhasePeerInstruction: this.is2ndPhasePeerInstruction,
        },
      },
    });
    dialogRef.afterClosed().subscribe((x: boolean) => {
      if (x) {
        this.dialogRef.close({
          session: this.livepollSession,
          reason: 'peerInstructionPhase1',
        });
      }
    });
  }

  private parseWebSocketStream(
    type: string,
    payload: MessagePayload,
    id?: UUID,
  ) {
    switch (type) {
      case 'LivepollResult':
        this.updateVotes(payload.votes);
        this.livepollService
          .getVote(this.livepollSession.id)
          .subscribe((vote) => {
            this.livepollVote = vote;
            this.waitForSocket = false;
            if (this.livepollVote) {
              if (
                this.voteQuery !== this.livepollVote.voteIndex &&
                this.voteQuery !== -1
              ) {
                const query = this.voteQuery;
                this.voteQuery = -1;
                this.vote(query);
              }
            }
          });
        break;
      case 'UserCountChanged':
        this.setUserCount(payload.userCount);
        break;
      default:
        console.error('Ignored [ type, payload, id ]', { type, payload, id });
    }
  }

  private updateVotes(votes: number[]) {
    for (let i = 0; i < this.votes.length; i++) {
      this.votes[i] = votes[i] || 0;
    }
  }

  private setUserCount(userCount: number) {
    this.userCount = userCount;
  }

  private createConfirmationDialog(
    confirmationDialogId: string,
    type: ConfirmDialogType = ConfirmDialogType.AcceptCancel,
  ): Observable<ConfirmDialogAction> {
    const dialog = this.dialog.open(LivepollConfirmationDialogComponent, {
      width: '500px',
      data: {
        type,
      },
    });
    dialog.componentInstance.confirmationDialogId = confirmationDialogId;
    return dialog.afterClosed().pipe(take(1));
  }

  private emitNotification(type: string) {
    this.translationService
      .get(this.translateKey + '.' + type)
      .subscribe((x) => {
        this.notification.show(x);
      });
  }

  private initTemplate() {
    if (!this.isProduction) {
      this.livepollSession.template = this.template.kind;
    }
    if (this.template) {
      LivepollComponentUtility.initTemplate(this);
    }
  }
}
