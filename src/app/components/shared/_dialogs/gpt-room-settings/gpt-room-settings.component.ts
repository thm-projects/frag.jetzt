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
import { GPTRoomSetting } from 'app/models/gpt-room-setting';
import { Room } from 'app/models/room';
import { UserRole } from 'app/models/user-roles.enum';
import { GPTRoomService } from 'app/services/http/gptroom.service';
import { AppStateService } from 'app/services/state/app-state.service';
import { NotificationService } from 'app/services/util/notification.service';
import { SessionService } from 'app/services/util/session.service';
import { KeyboardUtils } from 'app/utils/keyboard';
import { KeyboardKey } from 'app/utils/keyboard/keys';
import { ReplaySubject, takeUntil } from 'rxjs';

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
  disableEnhancedPrompt: boolean = false;
  disableForwardMessage: boolean = false;
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
  globalInfo = {
    active: false,
    counter: '?',
    max: '?',
  };
  private previousSetting: GPTRoomSetting;
  private destroyer = new ReplaySubject(1);
  private intlRangeDescription: Intl.DateTimeFormat;
  private intlPluralDetector: Intl.PluralRules;

  constructor(
    private gptRoomService: GPTRoomService,
    private dialogRef: MatDialogRef<GptRoomSettingsComponent>,
    private adapter: DateAdapter<any>,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private sessionService: SessionService,
    private appState: AppStateService,
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

  onWheel(event: WheelEvent) {
    event.stopImmediatePropagation();
  }

  ngOnInit(): void {
    this.appState.language$
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
    this.gptRoomService.getByRoomId(this.room.id).subscribe({
      next: (setting) => {
        this.isLoading = false;
        this.previousSetting = setting;
        this.canChangeParticipantQuota = setting.canChangeParticipantQuota();
        this.canChangeModeratorQuota = setting.canChangeModeratorQuota();
        this.canChangeRoomQuota = setting.canChangeRoomQuota();
        this.canChangePreset = setting.canChangePreset();
        this.canChangeUsageTimes = setting.canChangeUsageTimes();
        this.canChangeApiSettings = setting.canChangeApiSettings();
        this.allowsUnregisteredUsers = setting.allowsUnregisteredUsers();
        this.disableEnhancedPrompt = setting.disableEnhancedPrompt();
        this.disableForwardMessage = setting.disableForwardMessage();
        this.sessionService.getGPTStatusOnce().subscribe((status) => {
          this.globalInfo.active =
            status.globalInfo.globalActive &&
            !status.globalInfo.restricted &&
            !status.restricted;
        });
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
      this.sessionService.updateStatus();
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
      this.appState.getCurrentLanguage(),
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
