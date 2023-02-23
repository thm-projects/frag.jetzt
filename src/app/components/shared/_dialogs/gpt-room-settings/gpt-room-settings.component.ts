import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GPTRoomSetting, GPTRoomUsageTime } from 'app/models/gpt-room-setting';
import { Room } from 'app/models/room';
import { UserRole } from 'app/models/user-roles.enum';
import {
  GPTRoomSettingAPI,
  GptService,
  UsageTimeAction,
} from 'app/services/http/gpt.service';
import { LanguageService } from 'app/services/util/language.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { forkJoin, of, ReplaySubject, takeUntil } from 'rxjs';

enum UsageRepeatUnit {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

interface UsageTime {
  id?: string;
  settingId?: string;
  repeatDuration: number | null;
  repeatUnit: UsageRepeatUnit | null;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-gpt-room-settings',
  templateUrl: './gpt-room-settings.component.html',
  styleUrls: ['./gpt-room-settings.component.scss'],
})
export class GptRoomSettingsComponent implements OnInit, OnDestroy {
  @Input()
  room: Room;
  @Input()
  userRole: UserRole;
  trialEnabled: boolean = false;
  apiKey: string = null;
  apiOrganization: string = null;
  maxDailyRoomQuota: number = null;
  maxMonthlyRoomQuota: number = null;
  maxAccumulatedRoomQuota: number = null;
  maxDailyParticipantQuota: number = null;
  maxMonthlyParticipantQuota: number = null;
  maxAccumulatedParticipantQuota: number = null;
  maxDailyModeratorQuota: number = null;
  maxMonthlyModeratorQuota: number = null;
  maxAccumulatedModeratorQuota: number = null;
  canChangeParticipantQuota: boolean = false;
  canChangeModeratorQuota: boolean = false;
  canChangeRoomQuota: boolean = false;
  canChangeKeywords: boolean = false;
  canChangeUsageTimes: boolean = false;
  canChangeApiSettings: boolean = false;
  keywords: string[] = [];
  usageTimes: UsageTime[] = [];
  // only ng model variables
  trialCode: string = '';
  keywordAdd: string = '';
  repeatUnit: UsageRepeatUnit = UsageRepeatUnit.WEEK;
  repeatDuration: number = 1;
  // overview
  isLoading = true;
  isOwner = false;
  startDate: Date;
  endDate: Date;
  dateRange: FormGroup;
  possibleRepeatUnits = Object.keys(UsageRepeatUnit);
  private previousSetting: GPTRoomSetting;
  private destroyer = new ReplaySubject(1);
  private intlRangeDescription: Intl.DateTimeFormat;
  private intlPluralDetector: Intl.PluralRules;

  constructor(
    private gptService: GptService,
    private dialogRef: MatDialogRef<GptRoomSettingsComponent>,
    private adapter: DateAdapter<any>,
    private languageService: LanguageService,
  ) {
    this.startDate = new Date();
    this.startDate.setSeconds(0, 0);
    this.endDate = new Date(this.startDate.getTime() + 1_000 * 3_600 * 24);
    this.dateRange = new FormGroup({
      start: new FormControl(this.startDate),
      end: new FormControl(this.endDate),
    });
  }

  public static open(dialog: MatDialog, room: Room, userRole: UserRole) {
    const ref = dialog.open(GptRoomSettingsComponent, {
      width: '600px',
    });
    ref.componentInstance.room = room;
    ref.componentInstance.userRole = userRole;
    return ref;
  }

  ngOnInit(): void {
    this.languageService
      .getLanguage()
      .pipe(takeUntil(this.destroyer))
      .subscribe((lang) => {
        this.adapter.setLocale(lang);
        this.intlRangeDescription = new Intl.DateTimeFormat(lang, {
          weekday: 'long',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        this.intlPluralDetector = new Intl.PluralRules(lang);
      });
    this.isOwner = this.userRole === UserRole.CREATOR;
    this.gptService.getRoomSetting(this.room.id).subscribe({
      next: (setting) => {
        this.isLoading = false;
        this.previousSetting = setting;
        this.keywords = [...setting.keywords];
        this.usageTimes = [...setting.usageTimes];
        this.trialEnabled = setting.trialEnabled;
        this.apiKey = setting.apiKey;
        this.apiOrganization = setting.apiOrganization;
        this.maxDailyRoomQuota = setting.maxDailyRoomQuota;
        this.maxMonthlyRoomQuota = setting.maxMonthlyRoomQuota;
        this.maxAccumulatedRoomQuota = setting.maxAccumulatedRoomQuota;
        this.maxDailyParticipantQuota = setting.maxDailyParticipantQuota;
        this.maxMonthlyParticipantQuota = setting.maxMonthlyParticipantQuota;
        this.maxAccumulatedParticipantQuota =
          setting.maxAccumulatedParticipantQuota;
        this.maxDailyModeratorQuota = setting.maxDailyModeratorQuota;
        this.maxMonthlyModeratorQuota = setting.maxMonthlyModeratorQuota;
        this.maxAccumulatedModeratorQuota =
          setting.maxAccumulatedModeratorQuota;
        this.canChangeParticipantQuota = setting.canChangeParticipantQuota();
        this.canChangeModeratorQuota = setting.canChangeModeratorQuota();
        this.canChangeRoomQuota = setting.canChangeRoomQuota();
        this.canChangeKeywords = setting.canChangeKeywords();
        this.canChangeUsageTimes = setting.canChangeUsageTimes();
        this.canChangeApiSettings = setting.canChangeApiSettings();
      },
    });
  }

  ngOnDestroy(): void {
    this.destroyer.next(1);
    this.destroyer.complete();
  }

  isEnter(event: KeyboardEvent) {
    return KeyboardUtils.isKeyEvent(event, KeyboardKey.Enter);
  }

  activateTrial() {
    const code = this.trialCode;
    if (code.trim().length < 1) {
      return;
    }
    this.trialCode = '';
    this.gptService
      .activateTrial(this.room.id, code)
      .subscribe(() => (this.trialEnabled = true));
  }

  addKeyword() {
    this.keywords.push(this.keywordAdd);
    this.keywordAdd = '';
  }

  addUsageTime() {
    let repeatDur: number;
    let repeatUni: UsageRepeatUnit;
    if (this.repeatDuration == null || this.repeatUnit == null) {
      repeatDur = null;
      repeatUni = null;
    } else {
      if (this.repeatDuration < 1) {
        return;
      }
      repeatDur = this.repeatDuration;
      repeatUni = this.repeatUnit;
    }
    const startDate = this.dateRange.value.start as Date;
    const endDate = this.dateRange.value.end as Date;
    startDate.setHours(
      this.startDate.getHours(),
      this.startDate.getMinutes(),
      0,
      0,
    );
    endDate.setHours(this.endDate.getHours(), this.endDate.getMinutes(), 0, 0);
    if (startDate.getTime() >= endDate.getTime()) {
      return;
    }
    this.usageTimes.push({
      startDate,
      endDate,
      repeatDuration: repeatDur,
      repeatUnit: repeatUni,
    });
  }

  buildConfirmAction() {
    if (this.isLoading) {
      return undefined;
    }
    return () => {
      const operations = [
        of<string[]>([]),
        of<GPTRoomUsageTime[]>([]),
        of<GPTRoomSetting>(null),
      ];
      if (
        this.previousSetting.keywords.length !== this.keywords.length ||
        this.keywords.some(
          (key, index) => this.previousSetting.keywords[index] !== key,
        )
      ) {
        operations[0] = this.gptService.updateKeywords(
          this.room.id,
          this.keywords,
        );
      }
      {
        const usageOps: UsageTimeAction[] = [];
        this.previousSetting.usageTimes.forEach((elem) => {
          if (this.usageTimes.findIndex((v) => v.id === elem.id) < 0) {
            usageOps.push({
              deleteId: elem.id,
            });
          }
        });
        this.usageTimes.forEach((elem) => {
          if (!elem.id) {
            usageOps.push({
              repeatDuration: elem.repeatDuration,
              repeatUnit: elem.repeatUnit,
              startDate: elem.startDate,
              endDate: elem.endDate,
            });
          }
        });
        if (usageOps.length > 0) {
          console.log(usageOps);
          operations[1] = this.gptService.updateUsageTimes(
            this.room.id,
            usageOps,
          );
        }
      }
      {
        const patch: Partial<GPTRoomSettingAPI> = {};
        if (this.apiKey !== this.previousSetting.apiKey) {
          patch.apiKey = this.apiKey;
        }
        if (this.apiOrganization !== this.previousSetting.apiOrganization) {
          patch.apiOrganization = this.apiOrganization;
        }
        if (this.maxDailyRoomQuota !== this.previousSetting.maxDailyRoomQuota) {
          patch.maxDailyRoomQuota = this.maxDailyRoomQuota;
        }
        if (
          this.maxMonthlyRoomQuota !== this.previousSetting.maxMonthlyRoomQuota
        ) {
          patch.maxMonthlyRoomQuota = this.maxMonthlyRoomQuota;
        }
        if (
          this.maxAccumulatedRoomQuota !==
          this.previousSetting.maxAccumulatedRoomQuota
        ) {
          patch.maxAccumulatedRoomQuota = this.maxAccumulatedRoomQuota;
        }
        if (
          this.maxDailyParticipantQuota !==
          this.previousSetting.maxDailyParticipantQuota
        ) {
          patch.maxDailyParticipantQuota = this.maxDailyParticipantQuota;
        }
        if (
          this.maxMonthlyParticipantQuota !==
          this.previousSetting.maxMonthlyParticipantQuota
        ) {
          patch.maxMonthlyParticipantQuota = this.maxMonthlyParticipantQuota;
        }
        if (
          this.maxAccumulatedParticipantQuota !==
          this.previousSetting.maxAccumulatedParticipantQuota
        ) {
          patch.maxAccumulatedParticipantQuota =
            this.maxAccumulatedParticipantQuota;
        }
        if (
          this.maxDailyModeratorQuota !==
          this.previousSetting.maxDailyModeratorQuota
        ) {
          patch.maxDailyModeratorQuota = this.maxDailyModeratorQuota;
        }
        if (
          this.maxMonthlyModeratorQuota !==
          this.previousSetting.maxMonthlyModeratorQuota
        ) {
          patch.maxMonthlyModeratorQuota = this.maxMonthlyModeratorQuota;
        }
        if (
          this.maxAccumulatedModeratorQuota !==
          this.previousSetting.maxAccumulatedModeratorQuota
        ) {
          patch.maxAccumulatedModeratorQuota =
            this.maxAccumulatedModeratorQuota;
        }
        let rights = 0;
        if (this.canChangeParticipantQuota) {
          rights |= 0x1;
        }
        if (this.canChangeModeratorQuota) {
          rights |= 0x1 << 1;
        }
        if (this.canChangeRoomQuota) {
          rights |= 0x1 << 2;
        }
        if (this.canChangeKeywords) {
          rights |= 0x1 << 3;
        }
        if (this.canChangeUsageTimes) {
          rights |= 0x1 << 4;
        }
        if (this.canChangeApiSettings) {
          rights |= 0x1 << 5;
        }
        if (rights !== this.previousSetting.rightsBitset) {
          patch.rightsBitset = rights;
        }
        if (Object.keys(patch).length > 0) {
          operations[2] = this.gptService.patchRoomSetting(this.room.id, patch);
        }
      }
      forkJoin(operations).subscribe({
        complete: () => this.dialogRef.close(),
      });
    };
  }

  buildCancelAction() {
    return () => {
      this.dialogRef.close();
    };
  }

  formatRange(date1: Date, date2: Date) {
    return this.intlRangeDescription.formatRange(date1, date2);
  }

  getRepeatString(item: UsageTime): string {
    return (
      'gpt-room-settings.usage-time-repeat.' +
      this.intlPluralDetector.select(item.repeatDuration) +
      '_' +
      item.repeatUnit
    );
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
}
