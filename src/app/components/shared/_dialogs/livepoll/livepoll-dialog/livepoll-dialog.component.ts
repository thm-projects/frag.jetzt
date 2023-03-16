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
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { clone } from 'app/utils/ts-utils';

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

  get isActive(): boolean {
    return this.livepollSession?.active;
  }
  ngOnInit(): void {
    if (this.valueChange) {
      this.valueChange.subscribe((changedValue) => {
        this.template = changedValue;
        this.init();
      });
    }
    this.init();
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
    // todo: patch delete
  }

  setActive(active: boolean) {
    // this.livepollSession.active = active;
    // livepoll is still active even, when paused. this might need a new entry in livepoll-session
  }

  vote(i: number) {
    this.activeVote = i;
    if (this.isProduction) {
      //todo remove after backend implementation
      // this.emitVote(i);
      ++this.votes[i];
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

  private emitVote(i: number) {
    // todo
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
