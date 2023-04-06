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
  GPTActivationCode,
  GPTConfiguration,
  GPTQuotaUnit,
  GPTRestrictions,
} from 'app/models/gpt-configuration';
import { GPTStatistics } from 'app/models/gpt-statistics';
import { GptService } from 'app/services/http/gpt.service';
import { LanguageService } from 'app/services/util/language.service';
import { NotificationService } from 'app/services/util/notification.service';
import { ReplaySubject, takeUntil } from 'rxjs';

interface AddActivationCode {
  code: string;
  maximalCost: number;
}

interface DeleteActivationCode {
  code: string;
  delete: true;
}

type ActivationCodeAction = AddActivationCode | DeleteActivationCode;

@Component({
  selector: 'app-gpt-configuration',
  templateUrl: './gpt-configuration.component.html',
  styleUrls: ['./gpt-configuration.component.scss'],
})
export class GptConfigurationComponent implements OnInit, OnDestroy {
  @ViewChild('inputCheck') inputCheck: ElementRef<HTMLInputElement>;
  // config members
  apiKey: string = null;
  organization: string = null;
  // restriction members
  active: boolean = null;
  endDate: Date = null;
  platformCodes: GPTActivationCode[] = [];
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

  addActivationCode() {
    if (!this.isValid()) {
      return;
    }
    const newCode = this.activationCode.trim();
    if (this.platformCodes.findIndex((code) => code.code === newCode) >= 0) {
      return;
    }
    this.platformCodes.push(
      new GPTActivationCode({
        code: newCode,
        maximalCost: new GPTQuotaUnit({
          value: Math.round(this.activationMaxCost * 100),
          exponent: 2,
        }),
      }),
    );
    this.activationCode = '';
    this.activationMaxCost = 0;
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
    {
      const arr: ActivationCodeAction[] = [];
      for (const code of obj.platformCodes) {
        if (!this.platformCodes.includes(code)) {
          arr.push({
            code: code.code,
            delete: true,
          });
        }
      }
      for (const code of this.platformCodes) {
        if (!obj.platformCodes.includes(code)) {
          arr.push({
            code: code.code,
            maximalCost: code.maximalCost.toPlain(2),
          });
        }
      }
      if (arr.length > 0) {
        changes.platformCodes = arr as any;
      }
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
  }

  private loadRestrictions() {
    const obj = this.configuration.restrictions;
    this.active = obj.active;
    this.endDate = obj.endDate ? new Date(obj.endDate) : null;
    this.endDateControl.setValue(this.endDate);
    this.platformCodes = [...obj.platformCodes];
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
