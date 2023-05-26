import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { LivepollTemplateContext } from '../../../../../models/livepoll-template';
import { LanguageService } from '../../../../../services/util/language.service';
import { LivepollComponentUtility } from '../livepoll-component-utility';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject } from 'rxjs';
import { LivepollOptionEntry } from '../livepoll-dialog/livepoll-dialog.component';

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
  private readonly _destroyer = new ReplaySubject<any>(1);

  constructor(
    public readonly languageService: LanguageService,
    public readonly translateService: TranslateService,
    public readonly http: HttpClient,
  ) {
    LivepollComponentUtility.initLanguage(
      this.languageService,
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
