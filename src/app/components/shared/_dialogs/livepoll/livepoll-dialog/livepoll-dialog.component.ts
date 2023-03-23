import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
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
import { animate, style, transition, trigger } from '@angular/animations';
import { clone, UUID } from 'app/utils/ts-utils';
import { MatDialog } from '@angular/material/dialog';
import { LivepollConfirmationDialogComponent } from '../livepoll-confirmation-dialog/livepoll-confirmation-dialog.component';
import { take } from 'rxjs/operators';
import { LivepollVote } from '../../../../../models/livepoll-vote';
import { WsLivepollService } from '../../../../../services/websockets/ws-livepoll.service';
import { NotificationService } from '../../../../../services/util/notification.service';
import { ActiveUserService } from 'app/services/http/active-user.service';

const animateOpen = {
  opacity: 1,
  height: '*',
};

const animateClosed = {
  opacity: 0,
  height: '0px',
};

@Component({
  selector: 'app-livepoll-dialog',
  templateUrl: './livepoll-dialog.component.html',
  styleUrls: [
    './livepoll-dialog.component.scss',
    '../livepoll-create/livepoll-create.component.scss',
    '../livepoll-common.scss',
  ],
  animations: [
    trigger('AnimateInOut', [
      transition(':enter', [
        style(animateClosed),
        animate('200ms ease-in-out', style(animateOpen)),
      ]),
      transition(':leave', [
        animate('200ms ease-in-out', style(animateClosed)),
      ]),
    ]),
  ],
})
export class LivepollDialogComponent implements OnInit, OnDestroy {
  @Input() public livepollSession!: LivepollSession;
  @Input() public template: LivepollTemplateContext;
  @Input() public valueChange:
    | Observable<LivepollTemplateContext | null>
    | undefined;
  @Input() public isProduction: boolean = false;
  @Output() closeEmitter: EventEmitter<void> = new EventEmitter();
  public translateKey: string = 'common';
  public votes: number[] = [];
  public livepollVote: LivepollVote;
  public userCount: number = 1;
  public options:
    | {
        index: number;
        symbol: string;
      }[]
    | undefined;
  public isConclusion: boolean = false;
  public rowHeight: number;
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
    public readonly notification: NotificationService,
    private readonly activeUser: ActiveUserService,
  ) {
    this.languageService
      .getLanguage()
      .pipe(takeUntil(this._destroyer))
      .subscribe((lang) => {
        this.translationService.use(lang);
        this.http
          .get('/assets/i18n/livepoll/' + lang + '.json')
          .subscribe((translation) => {
            this.translationService.setTranslation(lang, translation, true);
          });
      });
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
    if (this.valueChange) {
      this.valueChange.subscribe((changedValue) => {
        this.template = null;
        setTimeout(() => {
          this.template = changedValue;
          this.initTemplate();
        }, 0);
      });
    }
    this.initTemplate();
    if (this.isProduction) {
      this.livepollService.listener
        .pipe(takeUntil(this._destroyer))
        .subscribe((changes) => {
          if (typeof changes.active !== 'undefined' && !changes.active) {
            this.isConclusion = true;
            this.onDeleteLivepoll();
          }
        });
      this.initWebSocketStream();
      this.livepollService
        .getVote(this.livepollSession.id)
        .subscribe((vote) => {
          this.livepollVote = vote;
        });
      this.activeUser
        .getActiveLivepollUser(this.livepollSession)
        .subscribe((value) => {
          this.userCount = value[0];
        });
      this.livepollService
        .getResults(this.livepollSession.id)
        .subscribe((results) => {
          this.updateVotes(results);
        });
    }
  }

  initWebSocketStream() {
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
  }

  parseWebSocketStream(type: string, payload: any, id?: UUID) {
    switch (type) {
      case 'LivepollResult':
        this.updateVotes(payload.votes);
        break;
      case 'UserCountChanged':
        this.setUserCount(payload.userCount);
        break;
      default:
        console.error('Ignored [ type, payload, id ]', { type, payload, id });
    }
  }

  updateVotes(votes: number[]) {
    for (let i = 0; i < this.votes.length; i++) {
      this.votes[i] = votes[i] || 0;
    }
  }

  setUserCount(userCount: number) {
    this.userCount = userCount;
  }

  ngOnDestroy(): void {
    this._destroyer.next(0);
  }

  public initFrom(livepollSession: LivepollSession) {
    this.livepollSession = livepollSession;
    this.lastSession = clone(this.livepollSession) as LivepollSession;
    this.template = templateEntries[this.livepollSession.template];
    this.isProduction = true;
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

  delete() {
    this.createConfirmationDialog(
      'dialog-confirm-delete-title',
      'dialog-confirm-delete-description',
    ).subscribe((x) => {
      if (x) {
        this.livepollService
          .delete(this.livepollSession.id)
          .subscribe((x) => {});
      }
    });
  }

  createConfirmationDialog(title: string, text: string): Observable<boolean> {
    const dialog = this.dialog.open(LivepollConfirmationDialogComponent, {
      width: '500px',
    });
    dialog.componentInstance.titleRef = title;
    dialog.componentInstance.textRef = text;
    return dialog.afterClosed().pipe(take(1));
  }

  pause() {
    this.livepollService
      .setPaused(this.livepollSession.id, true)
      .subscribe((livepollSession) => {
        this.livepollSession = livepollSession;
      });
  }

  play() {
    this.livepollService
      .setPaused(this.livepollSession.id, false)
      .subscribe((livepollSession) => {
        this.livepollSession = livepollSession;
      });
  }

  vote(i: number) {
    if (this.isProduction) {
      if (this.livepollVote && this.livepollVote.voteIndex === i) {
        this.livepollService
          .deleteVote(this.livepollSession.id)
          .subscribe((x) => {
            this.emitNotification('vote-delete');
          });
      } else {
        this.livepollService
          .makeVote(this.livepollSession.id, i)
          .subscribe((x) => {
            this.emitNotification('vote-make');
          });
      }
    } else {
      ++this.votes[i];
    }
  }

  emitNotification(type: string) {
    this.translationService
      .get(this.translateKey + '.' + type)
      .subscribe((x) => {
        this.notification.show(x);
      });
  }

  getVotePercentage(i: number) {
    return Math.floor(
      this.votes[i] ? (this.votes[i] / this.totalVotes) * 100 : 0,
    );
  }

  getVoteBarSize(i: number) {
    return Math.floor(
      this.votes[i]
        ? (this.votes[i] /
            ((this.votes.reduce((a, b) => Math.max(a, b)) + this.totalVotes) /
              2)) *
            100
        : 0,
    );
  }

  createNewLivepoll() {
    this.createConfirmationDialog(
      'dialog-confirm-create-new-title',
      'dialog-confirm-create-new-description',
    ).subscribe((x) => {
      if (x) {
        this.livepollService.delete(this.livepollSession.id).subscribe((x) => {
          this.closeEmitter.emit();
          this.livepollService.open(this.session.currentRole, false, null);
        });
      }
    });
  }

  getVoteButtonClass(index: number) {
    const collect: string[] = [];
    if (index === this.livepollVote?.voteIndex) {
      collect.push('active');
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

  private initTemplate() {
    if (!this.isProduction) {
      this.livepollSession.template = this.template.kind;
    }
    if (this.template) {
      this.votes = new Array(
        this.template.symbols?.length || this.template.length,
      ).fill(0);
      this.rowHeight = Math.ceil(this.votes.length / 2);
      if (typeof this.template.length === 'undefined') {
        this.options = this.template.symbols.map((option, index) => ({
          index,
          symbol: option,
        }));
      } else {
        const options: {
          index: number;
          symbol: string;
        }[] = [];
        for (let index = 0; index < this.template.length; index++) {
          options.push({
            index,
            symbol: 'option-' + this.template.name,
          });
        }
        this.options = options;
      }
    }
  }

  private onDeleteLivepoll() {
    if (!this.session.currentRole) {
      this.closeEmitter.emit();
    }
  }
}
