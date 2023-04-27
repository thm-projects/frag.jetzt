import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { GPTActivationCode } from 'app/models/gpt-configuration';
import { GPTRoomSetting, GPTRoomUsageTime } from 'app/models/gpt-room-setting';
import { Room } from 'app/models/room';
import { UserRole } from 'app/models/user-roles.enum';
import {
  GPTRoomSettingAPI,
  GptService,
  UsageTimeAction,
} from 'app/services/http/gpt.service';
import { LanguageService } from 'app/services/util/language.service';
import { NotificationService } from 'app/services/util/notification.service';
import { SessionService } from 'app/services/util/session.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { forkJoin, Observable, of, ReplaySubject, takeUntil } from 'rxjs';

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
  @ViewChildren('costInput') inputs: QueryList<ElementRef<HTMLInputElement>>;
  @Input()
  room: Room;
  @Input()
  userRole: UserRole;
  trialEnabled: boolean = false;
  apiKey: string = null;
  apiOrganization: string = null;
  maxDailyRoomCost: number = null;
  maxMonthlyRoomCost: number = null;
  maxMonthlyFlowingRoomCost: number = null;
  maxAccumulatedRoomCost: number = null;
  maxDailyParticipantCost: number = null;
  maxMonthlyParticipantCost: number = null;
  maxMonthlyFlowingParticipantCost: number = null;
  maxAccumulatedParticipantCost: number = null;
  maxDailyModeratorCost: number = null;
  maxMonthlyModeratorCost: number = null;
  maxMonthlyFlowingModeratorCost: number = null;
  maxAccumulatedModeratorCost: number = null;
  canChangeParticipantQuota: boolean = false;
  canChangeModeratorQuota: boolean = false;
  canChangeRoomQuota: boolean = false;
  canChangePreset: boolean = false;
  canChangeUsageTimes: boolean = false;
  canChangeApiSettings: boolean = false;
  allowsUnregisteredUsers: boolean = false;
  usageTimes: UsageTime[] = [];
  // only ng model variables
  trialCode: string = '';
  repeatUnit: UsageRepeatUnit = UsageRepeatUnit.WEEK;
  repeatDuration: number = 1;
  // overview
  isLoading = true;
  isOwner = false;
  startDate: Date;
  endDate: Date;
  dateRange: FormGroup;
  possibleRepeatUnits = Object.keys(UsageRepeatUnit);
  protected activatedCode: GPTActivationCode = null;
  private previousSetting: GPTRoomSetting;
  private destroyer = new ReplaySubject(1);
  private intlRangeDescription: Intl.DateTimeFormat;
  private intlPluralDetector: Intl.PluralRules;

  constructor(
    private gptService: GptService,
    private dialogRef: MatDialogRef<GptRoomSettingsComponent>,
    private adapter: DateAdapter<any>,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private sessionService: SessionService,
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
    const verify = (v: number) => (v ? v / 100 : v);
    this.gptService.getRoomSetting(this.room.id).subscribe({
      next: (setting) => {
        this.isLoading = false;
        this.previousSetting = setting;
        this.usageTimes = [...setting.usageTimes];
        this.activatedCode = setting.trialCode;
        this.trialEnabled = setting.trialEnabled;
        this.apiKey = setting.apiKey;
        this.apiOrganization = setting.apiOrganization;
        this.maxDailyRoomCost = verify(setting.maxDailyRoomCost);
        this.maxMonthlyRoomCost = verify(setting.maxMonthlyRoomCost);
        this.maxMonthlyFlowingRoomCost = verify(
          setting.maxMonthlyFlowingRoomCost,
        );
        this.maxAccumulatedRoomCost = verify(setting.maxAccumulatedRoomCost);
        this.maxDailyParticipantCost = verify(setting.maxDailyParticipantCost);
        this.maxMonthlyParticipantCost = verify(
          setting.maxMonthlyParticipantCost,
        );
        this.maxMonthlyFlowingParticipantCost = verify(
          setting.maxMonthlyFlowingParticipantCost,
        );
        this.maxAccumulatedParticipantCost = verify(
          setting.maxAccumulatedParticipantCost,
        );
        this.maxDailyModeratorCost = verify(setting.maxDailyModeratorCost);
        this.maxMonthlyModeratorCost = verify(setting.maxMonthlyModeratorCost);
        this.maxMonthlyFlowingModeratorCost = verify(
          setting.maxMonthlyFlowingModeratorCost,
        );
        this.maxAccumulatedModeratorCost = verify(
          setting.maxAccumulatedModeratorCost,
        );
        this.canChangeParticipantQuota = setting.canChangeParticipantQuota();
        this.canChangeModeratorQuota = setting.canChangeModeratorQuota();
        this.canChangeRoomQuota = setting.canChangeRoomQuota();
        this.canChangePreset = setting.canChangePreset();
        this.canChangeUsageTimes = setting.canChangeUsageTimes();
        this.canChangeApiSettings = setting.canChangeApiSettings();
        this.allowsUnregisteredUsers = setting.allowsUnregisteredUsers();
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
    const startDate = new Date(this.dateRange.value.start);
    const endDate = new Date(this.dateRange.value.end);
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
      if (!this.canSubmit()) {
        this.translateService
          .get('gpt-room-settings.rest-wrong')
          .subscribe((msg) => this.notificationService.show(msg));
        return;
      }
      const operations = [
        of<GPTRoomUsageTime[]>([]),
        of<GPTRoomSetting>(null),
      ] as [Observable<GPTRoomUsageTime[]>, Observable<GPTRoomSetting>];
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
          operations[0] = this.gptService.updateUsageTimes(
            this.room.id,
            usageOps,
          );
        }
      }
      {
        const verify = (v: number) => (v ? Math.round(v * 100) : v);
        const patch: Partial<GPTRoomSettingAPI> = {};
        if (this.apiKey !== this.previousSetting.apiKey) {
          patch.apiKey = this.apiKey;
        }
        if (this.apiOrganization !== this.previousSetting.apiOrganization) {
          patch.apiOrganization = this.apiOrganization;
        }
        let cost = verify(this.maxDailyRoomCost);
        if (cost !== this.previousSetting.maxDailyRoomCost) {
          patch.maxDailyRoomCost = cost;
        }
        cost = verify(this.maxMonthlyRoomCost);
        if (cost !== this.previousSetting.maxMonthlyRoomCost) {
          patch.maxMonthlyRoomCost = cost;
        }
        cost = verify(this.maxMonthlyFlowingRoomCost);
        if (cost !== this.previousSetting.maxMonthlyFlowingRoomCost) {
          patch.maxMonthlyFlowingRoomCost = cost;
        }
        cost = verify(this.maxAccumulatedRoomCost);
        if (cost !== this.previousSetting.maxAccumulatedRoomCost) {
          patch.maxAccumulatedRoomCost = cost;
        }
        cost = verify(this.maxDailyParticipantCost);
        if (cost !== this.previousSetting.maxDailyParticipantCost) {
          patch.maxDailyParticipantCost = cost;
        }
        cost = verify(this.maxMonthlyParticipantCost);
        if (cost !== this.previousSetting.maxMonthlyParticipantCost) {
          patch.maxMonthlyParticipantCost = cost;
        }
        cost = verify(this.maxMonthlyFlowingParticipantCost);
        if (cost !== this.previousSetting.maxMonthlyFlowingParticipantCost) {
          patch.maxMonthlyFlowingParticipantCost = cost;
        }
        cost = verify(this.maxAccumulatedParticipantCost);
        if (cost !== this.previousSetting.maxAccumulatedParticipantCost) {
          patch.maxAccumulatedParticipantCost = cost;
        }
        cost = verify(this.maxDailyModeratorCost);
        if (cost !== this.previousSetting.maxDailyModeratorCost) {
          patch.maxDailyModeratorCost = cost;
        }
        cost = verify(this.maxMonthlyModeratorCost);
        if (cost !== this.previousSetting.maxMonthlyModeratorCost) {
          patch.maxMonthlyModeratorCost = cost;
        }
        cost = verify(this.maxMonthlyFlowingModeratorCost);
        if (cost !== this.previousSetting.maxMonthlyFlowingModeratorCost) {
          patch.maxMonthlyFlowingModeratorCost = cost;
        }
        cost = verify(this.maxAccumulatedModeratorCost);
        if (cost !== this.previousSetting.maxAccumulatedModeratorCost) {
          patch.maxAccumulatedModeratorCost = cost;
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
        if (this.canChangePreset) {
          rights |= 0x1 << 3;
        }
        if (this.canChangeUsageTimes) {
          rights |= 0x1 << 4;
        }
        if (this.canChangeApiSettings) {
          rights |= 0x1 << 5;
        }
        if (this.allowsUnregisteredUsers) {
          rights |= 0x1 << 6;
        }
        if (rights !== this.previousSetting.rightsBitset) {
          patch.rightsBitset = rights;
        }
        if (Object.keys(patch).length > 0) {
          operations[1] = this.gptService.patchRoomSetting(this.room.id, patch);
        }
      }
      forkJoin(operations).subscribe({
        next: () => {
          this.sessionService.updateStatus();
        },
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

  private canSubmit() {
    let ok = true;
    this.inputs.forEach((element) => {
      if (element?.nativeElement?.checkValidity?.() === false) {
        ok = false;
      }
    });
    return ok;
  }
}
