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
import {
  LivepollCustomTemplateEntry,
  LivepollSession,
} from '../../../../../models/livepoll-session';
import { animate, style, transition, trigger } from '@angular/animations';
import { clone } from 'app/utils/ts-utils';
import { MatDialog } from '@angular/material/dialog';
import { LivepollConfirmationDialogComponent } from '../livepoll-confirmation-dialog/livepoll-confirmation-dialog.component';
import { take } from 'rxjs/operators';
import { LivepollVote } from '../../../../../models/livepoll-vote';
import { WsLivepollService } from '../../../../../services/websockets/ws-livepoll.service';

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
  public activeVote: number = -1;
  public votes: number[] = [];
  public livepollVote: LivepollVote;
  public userCount: number = 1;
  public options:
    | {
        index: number;
        symbol: string;
      }[]
    | undefined;
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
        this.template = changedValue;
        this.init();
      });
    }
    this.init();
    if (this.isProduction) {
      this.livepollService
        .getVote(this.livepollSession.id)
        .subscribe((vote) => {
          this.livepollVote = vote;
          if (vote) {
            this.activeVote = vote.voteIndex;
          } else {
            this.activeVote = -1;
            // user has not voted yet
          }
        });
      this.wsLivepollService
        .getLivepollUserCountStream(this.livepollSession.id)
        .subscribe((userCount) => {
          console.log(
            'this.wsLivepollService.getLivepollUserCountStream(this.livepollSession.id)',
            userCount,
          );
        });
      const interval = setInterval(() => {
        this.livepollService
          .getResults(this.livepollSession.id)
          .pipe(take(1))
          .subscribe((result) => {
            console.log(
              'this.livepollService.getResults(this.livepollSession.id)',
              result,
            );
          });
      }, 1000);
      this._destroyer.subscribe(() => {
        clearInterval(interval);
      });
    }
  }

  ngOnDestroy(): void {
    this._destroyer.next(0);
  }

  public initFrom(livepollSession?: LivepollSession) {
    if (livepollSession) {
      this.livepollSession = livepollSession;
      this.lastSession = clone(this.livepollSession) as LivepollSession;
      this.template = templateEntries[this.livepollSession.template];
      this.isProduction = true;
    } else {
      this.initFrom(this.session.currentLivepoll);
    }
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
    const dialog = this.dialog.open(LivepollConfirmationDialogComponent, {
      width: '500px',
    });
    dialog
      .afterClosed()
      .pipe(take(1))
      .subscribe((x) => {
        if (x) {
          this.livepollService.delete(this.livepollSession.id);
        }
      });
  }

  pause() {
    this.livepollService
      .setActive(this.livepollSession.id, true)
      .subscribe((livepollSession) => {
        this.livepollSession = livepollSession;
      });
  }

  play() {
    this.livepollService
      .setActive(this.livepollSession.id, false)
      .subscribe((livepollSession) => {
        this.livepollSession = livepollSession;
      });
  }

  vote(i: number) {
    if (this.isProduction) {
      if (this.activeVote === i) {
        this.livepollService.deleteVote(this.livepollSession.id);
      } else {
        this.livepollService.makeVote(this.livepollSession.id, i);
      }
    } else {
      ++this.votes[i];
    }
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

  private init() {
    if (this.template) {
      this.votes = new Array(
        this.template.symbols?.length || this.template.length,
      ).fill(0);
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
}
