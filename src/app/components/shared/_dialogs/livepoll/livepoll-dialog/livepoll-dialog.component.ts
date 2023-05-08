import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { DeviceInfoService } from '../../../../../services/util/device-info.service';
import {
  LivepollTemplateContext,
  templateEntries,
} from '../../../../../models/livepoll-template';
import { Observable, ReplaySubject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../../services/util/language.service';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../../../../services/util/session.service';
import {
  LivepollService,
  LivepollSessionPatchAPI,
} from '../../../../../services/http/livepoll.service';
import { LivepollSession } from '../../../../../models/livepoll-session';
import { clone, UUID } from 'app/utils/ts-utils';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { LivepollConfirmationDialogComponent } from '../livepoll-confirmation-dialog/livepoll-confirmation-dialog.component';
import { take } from 'rxjs/operators';
import { LivepollVote } from '../../../../../models/livepoll-vote';
import { WsLivepollService } from '../../../../../services/websockets/ws-livepoll.service';
import { NotificationService } from '../../../../../services/util/notification.service';
import { ActiveUserService } from 'app/services/http/active-user.service';
import { LivepollComponentUtility } from '../livepoll-component-utility';

export interface LivepollDialogInjectionData {
  session: LivepollSession;
  isProduction: boolean;
}

export type LivepollDialogResponseReason =
  | 'close'
  | 'delete'
  | 'reset'
  | 'closedAsParticipant'
  | 'closedAsCreator';

export interface LivepollDialogResponseData {
  session: LivepollSession;
  reason: LivepollDialogResponseReason;
}

export interface LivepollOptionEntry {
  index: number;
  symbol: string;
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
export class LivepollDialogComponent implements OnInit, OnDestroy {
  @Input() public livepollSession: LivepollSession | undefined;
  @Input() public template: LivepollTemplateContext;
  @Input() public isProduction: boolean = false;
  public translateKey: string = 'common';
  public votes: number[] = [];
  public livepollVote: LivepollVote;
  public userCount: number = 1;
  public options: LivepollOptionEntry[] | undefined;
  public isConclusion: boolean = false;
  public waitForSocket: boolean = false;
  public rowHeight: number;
  private voteQuery: number = -1;
  private _destroyer = new ReplaySubject(1);
  private lastSession: LivepollSession;

  constructor(
    public readonly device: DeviceInfoService,
    public readonly languageService: LanguageService,
    public readonly translationService: TranslateService,
    public readonly http: HttpClient,
    public readonly session: SessionService,
    public readonly livepollService: LivepollService,
    public readonly wsLivepollService: WsLivepollService,
    public readonly dialog: MatDialog,
    public readonly dialogRef: MatDialogRef<LivepollDialogResponseData>,
    public readonly notification: NotificationService,
    private readonly activeUser: ActiveUserService,
    @Inject(MAT_DIALOG_DATA) data: LivepollDialogInjectionData,
  ) {
    if (data) {
      this.livepollSession = data.session;
      this.isProduction = data.isProduction;
      this.lastSession = clone(this.livepollSession) as LivepollSession;
      this.template = templateEntries[this.livepollSession.template];
    }
    LivepollComponentUtility.initLanguage(
      this.languageService,
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
      // Template can't change, only needs to be initialized once
      this.initTemplate();
      if (this.isProduction) {
        this.livepollService.listener
          .pipe(takeUntil(this._destroyer))
          .subscribe((changes) => {
            if (!this.session.currentLivepoll) {
              if (this.session.currentRole) {
                this.close('closedAsCreator');
              } else {
                this.close('closedAsParticipant');
              }
            }
          });
        // init ws.service
        this.wsLivepollService
          .getLivepollUserCountStream(
            this.livepollSession.id,
            this.session.currentRole,
          )
          .pipe(takeUntil(this._destroyer))
          .subscribe((userCount) => {
            const parsed = JSON.parse(userCount.body);
            if (parsed.hasOwnProperty('UserCountChanged')) {
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

  ngOnDestroy(): void {
    this._destroyer.next(0);
  }

  public save() {
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
      return;
    }
    this.livepollService
      .update(this.livepollSession.id, data)
      .subscribe((d) => (this.lastSession = d));
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
              this.emitNotification('vote-delete');
              this.waitForSocket = true;
            });
        } else {
          this.livepollService
            .makeVote(this.livepollSession.id, i)
            .subscribe(() => {
              this.emitNotification('vote-make');
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
      case 'delete':
        this.createConfirmationDialog(
          'dialog-confirm-delete-title',
          'dialog-confirm-delete-description',
        ).subscribe((x) => {
          if (x) {
            this.dialogRef.close({
              session: this.livepollSession,
              reason,
            });
          }
        });
        break;
      case 'reset':
        this.createConfirmationDialog(
          'dialog-confirm-create-new-title',
          'dialog-confirm-create-new-description',
        ).subscribe((x) => {
          if (x) {
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

  public getVoteButtonClass(index: number) {
    const collect: string[] = [];
    if (index === this.livepollVote?.voteIndex) {
      collect.push('voted');
    } else {
      collect.push('default');
    }
    if (this.template.translate) {
      collect.push('translated-text');
    } else if (!this.template.translate && this.template.isPlain) {
      collect.push('text-as-icon');
    } else if (!!this.template.symbols) {
      collect.push('material-icons');
    }
    return collect.map((x) => `button-vote-${x}`).join(' ');
  }

  resetResults() {
    this.createConfirmationDialog(
      'dialog-confirm-resetResults-title',
      'dialog-confirm-resetResults-description',
    ).subscribe((x) => {
      if (x) {
        this.livepollService
          .resetResults(this.livepollSession.id)
          .subscribe((votes) => {
            console.log(votes);
          });
      }
    });
  }

  private parseWebSocketStream(type: string, payload: any, id?: UUID) {
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
    title: string,
    text: string,
  ): Observable<boolean> {
    const dialog = this.dialog.open(LivepollConfirmationDialogComponent, {
      width: '500px',
    });
    dialog.componentInstance.titleRef = title;
    dialog.componentInstance.textRef = text;
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
