import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';
import {
  GPTConfiguration,
  GPTRestrictions,
} from 'app/models/gpt-configuration';
import { GPTStatistics } from 'app/models/gpt-statistics';
import { GptService } from 'app/services/http/gpt.service';
import {
  GPTVoucher,
  GPTVoucherService,
} from 'app/services/http/gptvoucher.service';
import { Quota, QuotaEntry } from 'app/services/http/quota.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { NotificationService } from 'app/services/util/notification.service';
import { ReplaySubject, map, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-gpt-configuration',
  templateUrl: './gpt-configuration.component.html',
  styleUrls: ['./gpt-configuration.component.scss'],
  standalone: false,
})
export class GptConfigurationComponent implements OnInit, OnDestroy {
  @ViewChild('inputCheck') inputCheck: ElementRef<HTMLInputElement>;
  // config members
  apiKey: string = null;
  organization: string = null;
  // restriction members
  active: boolean = null;
  globalActive: boolean = null;
  globalAccumulatedQuota: number = 0;
  endDate: Date = null;
  platformCodes: GPTVoucher[] = [];
  // stats
  statistics: GPTStatistics = null;
  // ui
  activationCode: string = '';
  activationMaxCost: number = 0;
  step = -1;
  isLoading = true;
  endDateControl = new FormControl(null);
  private destroyer = new ReplaySubject(1);
  private configuration: GPTConfiguration;

  constructor(
    private gptService: GptService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private appState: AppStateService,
    private adapter: DateAdapter<unknown>,
    private gptVoucherService: GPTVoucherService,
  ) {}

  ngOnInit(): void {
    this.appState.language$
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => {
        this.adapter.setLocale(lang);
      });
    this.reloadConfig();
  }

  ngOnDestroy(): void {
    this.destroyer.next(0);
    this.destroyer.complete();
  }

  checkEnter(e: KeyboardEvent, func: () => void) {
    if (e.key === 'Enter') {
      func.bind(this)();
    }
  }

  isValid() {
    return (
      this.activationMaxCost >= 0 &&
      this.activationCode.length >= 8 &&
      this.inputCheck?.nativeElement?.checkValidity?.()
    );
  }

  deleteActivationCode(i: number) {
    const voucher = this.platformCodes.splice(i, 1)[0];
    this.gptVoucherService.delete(voucher.id).subscribe();
  }

  addActivationCode() {
    if (!this.isValid()) {
      return;
    }
    const newCode = this.activationCode.trim();
    if (this.platformCodes.findIndex((code) => code.code === newCode) >= 0) {
      return;
    }
    const quota = new Quota({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      entries: [
        new QuotaEntry({
          quota: Math.round(this.activationMaxCost * 10 ** 8),
          resetStrategy: 'MONTHLY_FLOWING',
        }),
      ],
    });
    this.gptVoucherService
      .create(newCode)
      .pipe(
        switchMap((e) => {
          return this.gptVoucherService.createQuota(e.id, quota).pipe(
            map((q) => {
              e.quotaId = q.id;
              return e;
            }),
          );
        }),
      )
      .subscribe((code) => this.platformCodes.push(code));
    this.activationCode = '';
    this.activationMaxCost = 0;
  }

  getDateFormatString() {
    const str = new Date(2345, 0, 11).toLocaleDateString(
      this.appState.getCurrentLanguage(),
    );
    return str
      .replace(/(\D|^)2345(\D|$)/, '$1YYYY$2')
      .replace(/(\D|^)11(\D|$)/, '$1MM$2')
      .replace(/(\D|^)\d*1(\D|$)/, '$1DD$2');
  }

  prettyDate(date: Date) {
    return date.toLocaleString(this.appState.getCurrentLanguage(), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  saveProperties() {
    const obj = this.configuration;
    const changes: Partial<GPTConfiguration> = {};
    if (this.apiKey !== obj.apiKey) {
      changes.apiKey = this.apiKey;
    }
    if (this.organization !== obj.organization) {
      changes.organization = this.organization;
    }
    if (Object.keys(changes).length < 1) {
      return;
    }
    this.updateGPT(changes);
  }

  onWheel(event: WheelEvent) {
    event.stopImmediatePropagation();
  }

  saveRestrictions() {
    const obj = this.configuration.restrictions;
    const changes: Partial<GPTRestrictions> = {};
    if (this.active !== obj.active) {
      changes.active = this.active;
    }
    if (this.globalActive !== obj.globalActive) {
      changes.globalActive = this.globalActive;
    }
    const changed = Math.round(this.globalAccumulatedQuota * 100);
    if (changed !== obj.globalAccumulatedQuota) {
      changes.globalAccumulatedQuota = changed;
    }
    const endDate = this.endDateControl.value as Date;
    if (endDate !== null) {
      endDate.setHours(
        this.endDate.getHours(),
        this.endDate.getMinutes(),
        0,
        0,
      );
    }
    if (endDate?.getTime() !== obj.endDate?.getTime()) {
      changes.endDate = endDate;
    }
    if (Object.keys(changes).length < 1) {
      return;
    }
    this.updateGPT({ restrictions: changes as GPTRestrictions });
  }

  updateStatistics() {
    this.gptService.getStats().subscribe({
      next: (s) => {
        this.statistics = s;
      },
      error: (e) => {
        console.error(e);
        this.translateService
          .get('gpt-config.load-stats-error')
          .subscribe((msg) => this.notificationService.show(msg));
      },
    });
  }

  protected getQuotaMax(v: GPTVoucher) {
    return v['max'] || '?';
  }

  protected getQuotaUsed(v: GPTVoucher) {
    return v['used'] || '?';
  }

  private reloadConfig(): void {
    this.isLoading = true;
    this.gptService.getConfiguration().subscribe({
      next: (c) => {
        this.isLoading = false;
        this.configuration = c;
        this.loadProperties();
        this.loadRestrictions();
      },
      error: (e) => {
        console.error(e);
        this.translateService
          .get('gpt-config.load-error')
          .subscribe((msg) => this.notificationService.show(msg));
      },
    });
    this.gptVoucherService.getAll().subscribe((data) => {
      this.platformCodes = [...data];
    });
  }

  private loadProperties() {
    const obj = this.configuration;
    this.apiKey = obj.apiKey;
    this.organization = obj.organization;
  }

  private loadRestrictions() {
    const obj = this.configuration.restrictions;
    this.active = obj.active;
    this.globalActive = obj.globalActive;
    this.globalAccumulatedQuota = obj.globalAccumulatedQuota / 100;
    this.endDate = obj.endDate ? new Date(obj.endDate) : null;
    this.endDateControl.setValue(this.endDate);
  }

  private updateGPT(changes: Partial<GPTConfiguration>) {
    this.isLoading = true;
    this.gptService.patchConfiguration(changes).subscribe({
      next: () => {
        this.reloadConfig();
      },
      error: () => {
        this.isLoading = false;
        this.translateService
          .get('gpt-config.save-error')
          .subscribe((msg) => this.notificationService.show(msg));
      },
    });
  }
}
