import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';
import {
  GPTConfiguration,
  GPTRestrictions,
} from 'app/models/gpt-configuration';
import { GPTModels } from 'app/models/gpt-models';
import { GPTStatistics } from 'app/models/gpt-statistics';
import { GptService, GPTUsage } from 'app/services/http/gpt.service';
import { LanguageService } from 'app/services/util/language.service';
import { NotificationService } from 'app/services/util/notification.service';
import { ReplaySubject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-gpt-configuration',
  templateUrl: './gpt-configuration.component.html',
  styleUrls: ['./gpt-configuration.component.scss'],
})
export class GptConfigurationComponent implements OnInit, OnDestroy {
  // config members
  apiKey: string = null;
  organization: string = null;
  model: string = null;
  suffix: string = null;
  maxTokens: number = null;
  temperature: number = null;
  topP: number = null;
  n: number = null;
  stream: boolean = null;
  logprobs: number = null;
  echo: boolean = null;
  stop: string[] = [];
  presencePenalty: number = null;
  frequencyPenalty: number = null;
  bestOf: number = null;
  logitBias: { [key: string]: number } = {};
  // restriction members
  active: boolean = null;
  usage: GPTUsage = null;
  ipFilter: string[] = [];
  endDate: Date = null;
  accumulatedPlatformQuota: number = null;
  weeklyPlatformQuota: number = null;
  dailyPlatformQuota: number = null;
  accumulatedUserQuota: number = null;
  weeklyUserQuota: number = null;
  dailyUserQuota: number = null;
  // stats
  statistics: GPTStatistics = null;
  // additional
  models: GPTModels = null;
  addStop: string = null;
  addLogitBias: string = null;
  addIpFilter: string = null;
  // ui
  step = -1;
  isLoading = true;
  endDateControl = new FormControl(null);
  private destroyer = new ReplaySubject(1);
  private configuration: GPTConfiguration;

  constructor(
    private gptService: GptService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private languageService: LanguageService,
    private adapter: DateAdapter<any>,
  ) {}

  ngOnInit(): void {
    this.languageService
      .getLanguage()
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => {
        this.adapter.setLocale(lang);
      });
    this.gptService.getModelsOnce().subscribe({
      next: (m) => (this.models = m),
      error: () => {
        this.translateService
          .get('gpt-config.model-fetch-error')
          .subscribe((msg) => this.notificationService.show(msg));
      },
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

  addStopWord() {
    if (this.addStop === null || this.addStop.length === 0) {
      return;
    }
    if (this.stop.indexOf(this.addStop) >= 0) {
      return;
    }
    this.stop.push(this.addStop);
    this.addStop = null;
  }

  addLogit() {
    if (this.addLogitBias === null || this.addLogitBias.length === 0) {
      return;
    }
    if (Object.keys(this.logitBias).indexOf(this.addLogitBias) >= 0) {
      return;
    }
    this.logitBias[this.addLogitBias] = 0.0;
    this.addLogitBias = null;
  }

  addSubnet() {
    if (this.addIpFilter === null || this.addIpFilter.length === 0) {
      return;
    }
    const newSubnet = this.addIpFilter.includes('/')
      ? this.addIpFilter
      : this.addIpFilter + '/0';
    if (this.ipFilter.indexOf(newSubnet) >= 0) {
      return;
    }
    this.ipFilter.push(newSubnet);
    this.addIpFilter = null;
  }

  deleteLogitBias(element: string) {
    delete this.logitBias[element];
  }

  getDateFormatString() {
    const str = new Date(2345, 0, 11).toLocaleDateString(
      this.languageService.currentLanguage(),
    );
    return str
      .replace(/(\D|^)2345(\D|$)/, '$1YYYY$2')
      .replace(/(\D|^)11(\D|$)/, '$1MM$2')
      .replace(/(\D|^)\d*1(\D|$)/, '$1DD$2');
  }

  prettyDate(date: Date) {
    return date.toLocaleString(this.languageService.currentLanguage(), {
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
    if (this.model !== obj.model) {
      changes.model = this.model;
    }
    if (this.suffix !== obj.suffix) {
      changes.suffix = this.suffix;
    }
    if (this.maxTokens !== obj.maxTokens) {
      changes.maxTokens = this.maxTokens;
    }
    if (this.temperature !== obj.temperature) {
      changes.temperature = this.temperature;
    }
    if (this.topP !== obj.topP) {
      changes.topP = this.topP;
    }
    if (this.n !== obj.n) {
      changes.n = this.n;
    }
    if (this.stream !== obj.stream) {
      changes.stream = this.stream;
    }
    if (this.logprobs !== obj.logprobs) {
      changes.logprobs = this.logprobs;
    }
    if (this.echo !== obj.echo) {
      changes.echo = this.echo;
    }
    if (this.stop.length < 1) {
      if (null !== obj.stop) {
        changes.stop = null;
      }
    } else if (this.stop.length === 1) {
      if (this.stop[0] !== obj.stop) {
        changes.stop = this.stop[0];
      }
    } else {
      if (
        !Array.isArray(obj.stop) ||
        obj.stop.length !== this.stop.length ||
        !this.stop.every((v, i) => obj.stop[i] === v)
      ) {
        changes.stop = [...this.stop];
      }
    }
    if (this.presencePenalty !== obj.presencePenalty) {
      changes.presencePenalty = this.presencePenalty;
    }
    if (this.frequencyPenalty !== obj.frequencyPenalty) {
      changes.frequencyPenalty = this.frequencyPenalty;
    }
    if (this.bestOf !== obj.bestOf) {
      changes.bestOf = this.bestOf;
    }
    const keys = Object.keys(this.logitBias);
    const objKeys = Object.keys(obj.logitBias || {});
    if (
      keys.length !== objKeys.length ||
      !keys.every((k) => this.logitBias[k] === obj.logitBias[k])
    ) {
      changes.logitBias = keys.length > 0 ? { ...this.logitBias } : null;
    }
    if (Object.keys(changes).length < 1) {
      return;
    }
    this.updateGPT(changes);
  }

  saveRestrictions() {
    const obj = this.configuration.restrictions;
    const changes: Partial<GPTRestrictions> = {};
    if (this.active !== obj.active) {
      changes.active = this.active;
    }
    if (this.usage !== obj.usage) {
      changes.usage = this.usage;
    }
    const mergedIpFilter = this.ipFilter.join('|');
    if (mergedIpFilter !== obj.ipFilter) {
      changes.ipFilter = mergedIpFilter;
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
    if (this.accumulatedPlatformQuota !== obj.accumulatedPlatformQuota) {
      changes.accumulatedPlatformQuota = this.accumulatedPlatformQuota;
    }
    if (this.weeklyPlatformQuota !== obj.weeklyPlatformQuota) {
      changes.weeklyPlatformQuota = this.weeklyPlatformQuota;
    }
    if (this.dailyPlatformQuota !== obj.dailyPlatformQuota) {
      changes.dailyPlatformQuota = this.dailyPlatformQuota;
    }
    if (this.accumulatedUserQuota !== obj.accumulatedUserQuota) {
      changes.accumulatedUserQuota = this.accumulatedUserQuota;
    }
    if (this.weeklyUserQuota !== obj.weeklyUserQuota) {
      changes.weeklyUserQuota = this.weeklyUserQuota;
    }
    if (this.dailyUserQuota !== obj.dailyUserQuota) {
      changes.dailyUserQuota = this.dailyUserQuota;
    }
    console.log(changes);
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
  }

  private loadProperties() {
    const obj = this.configuration;
    this.apiKey = obj.apiKey;
    this.organization = obj.organization;
    this.model = obj.model;
    this.suffix = obj.suffix;
    this.maxTokens = obj.maxTokens;
    this.temperature = obj.temperature;
    this.topP = obj.topP;
    this.n = obj.n;
    this.stream = obj.stream;
    this.logprobs = obj.logprobs;
    this.echo = obj.echo;
    if (Array.isArray(obj.stop)) {
      this.stop = [...obj.stop];
    } else {
      this.stop = obj.stop ? [obj.stop] : [];
    }
    this.presencePenalty = obj.presencePenalty;
    this.frequencyPenalty = obj.frequencyPenalty;
    this.bestOf = obj.bestOf;
    this.logitBias = { ...obj.logitBias };
  }

  private loadRestrictions() {
    const obj = this.configuration.restrictions;
    this.active = obj.active;
    this.usage = obj.usage;
    this.ipFilter = obj.ipFilter.split('|');
    this.endDate = obj.endDate ? new Date(obj.endDate) : null;
    this.endDateControl.setValue(this.endDate);
    this.accumulatedPlatformQuota = obj.accumulatedPlatformQuota;
    this.weeklyPlatformQuota = obj.weeklyPlatformQuota;
    this.dailyPlatformQuota = obj.dailyPlatformQuota;
    this.accumulatedUserQuota = obj.accumulatedUserQuota;
    this.weeklyUserQuota = obj.weeklyUserQuota;
    this.dailyUserQuota = obj.dailyUserQuota;
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
