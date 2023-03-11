import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DeviceInfoService } from '../../../../services/util/device-info.service';
import {
  LivepollTemplateContext,
  templateEntries,
} from '../../../../models/livepoll-template';
import { Observable, ReplaySubject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../../services/util/language.service';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../../../services/util/session.service';
import { LivepollService } from '../../../../services/http/livepoll.service';
import { LivepollSession } from '../../../../models/livepoll-session';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

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
  public translateKey: string = 'common';
  public selectedPreviewOption: number = -1;
  public options:
    | {
        index: number;
        symbol: string;
      }[]
    | undefined;
  private _destroyer = new ReplaySubject(1);

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

  public initFromSession() {
    this.livepollSession = this.session.currentLivepoll;
    this.template = templateEntries[this.livepollSession.template];
    this.isProduction = true;
  }

  public save() {
    this.livepollService.update(this.livepollSession);
    this.session.updateCurrentRoom({
      livepollSession: this.livepollSession,
    });
  }

  delete() {
    // todo: patch delete
  }

  setActive(active: boolean) {
    this.livepollSession.active = active;
  }

  private init() {
    if (this.template) {
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
