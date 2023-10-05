import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LivepollTemplateContext } from '../../../../../models/livepoll-template';
import { LivepollComponentUtility } from '../livepoll-component-utility';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject, takeUntil } from 'rxjs';
import { LivepollOptionEntry } from '../livepoll-dialog/livepoll-dialog.component';
import { Language } from 'app/services/http/languagetool.service';
import { AppStateService } from 'app/services/state/app-state.service';

@Component({
  selector: 'app-livepoll-statistic',
  templateUrl: './livepoll-statistic.component.html',
  styleUrls: ['./livepoll-statistic.component.scss'],
  animations: [...LivepollComponentUtility.animation],
})
export class LivepollStatisticComponent implements OnInit, OnDestroy {
  @Input() options: LivepollOptionEntry[] | undefined;

  @Input() template: LivepollTemplateContext;
  @Input() translateKey: string;
  @Input() votes: number[] = [];
  @Input() totalVotes: number;
  currentLanguage: Language;
  private readonly _destroyer = new ReplaySubject<any>(1);

  constructor(
    public readonly translateService: TranslateService,
    public readonly http: HttpClient,
    appState: AppStateService,
  ) {
    appState.language$
      .pipe(takeUntil(this._destroyer))
      .subscribe((lang) => (this.currentLanguage = lang));
    LivepollComponentUtility.initLanguage(
      appState,
      this.translateService,
      this.http,
      this._destroyer,
    );
  }

  ngOnDestroy(): void {
    this._destroyer.next(0);
  }

  ngOnInit(): void {}

  public getVotePercentage(i: number) {
    return Math.floor(
      this.votes[i] ? (this.votes[i] / this.totalVotes) * 100 : 0,
    );
  }

  public getVoteBarSize(i: number) {
    return this.getVotePercentage(i);
  }
}
