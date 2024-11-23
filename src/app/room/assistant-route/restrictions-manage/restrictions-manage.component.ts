import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  computed,
  effect,
  inject,
  input,
  Signal,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { language } from 'app/base/language/language';
import { ContextPipe } from 'app/base/i18n/context.pipe';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { UUID } from 'app/utils/ts-utils';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AssistantRestrictionService,
  BlockRestriction,
  InputBlockRestriction,
  InputQuotaRestriction,
  InputTimeRestriction,
  QuotaRestriction,
  TimeRestriction as TR,
} from '../services/assistant-restriction.service';
import { concatMap, forkJoin, map, Observable, of } from 'rxjs';
import { room } from 'app/room/state/room';
import { user } from 'app/user/state/user';
import { NotificationService } from 'app/services/util/notification.service';

const TARGETS = [
  'ALL',
  'UNREGISTERED',
  'REGISTERED',
  'USER',
  'UNREGISTERED_USER',
  'REGISTERED_USER',
  'MOD',
  'UNREGISTERED_MOD',
  'REGISTERED_MOD',
  'CREATOR',
] as const;

type RestrictionTarget = (typeof TARGETS)[number];

type FilterFunction = (blocked: Set<RestrictionTarget>) => boolean;

const FILTER_OBJECT: { [key in RestrictionTarget]: FilterFunction } = {
  ALL: () => true,
  UNREGISTERED: (set) => !set.has('UNREGISTERED'),
  REGISTERED: (set) => !set.has('REGISTERED'),
  USER: (set) => !set.has('USER'),
  UNREGISTERED_USER: (set) =>
    !set.has('UNREGISTERED_USER') &&
    !set.has('USER') &&
    !set.has('UNREGISTERED'),
  REGISTERED_USER: (set) =>
    !set.has('REGISTERED_USER') && !set.has('USER') && !set.has('REGISTERED'),
  MOD: (set) => !set.has('MOD'),
  UNREGISTERED_MOD: (set) =>
    !set.has('UNREGISTERED_MOD') && !set.has('MOD') && !set.has('UNREGISTERED'),
  REGISTERED_MOD: (set) =>
    !set.has('REGISTERED_MOD') && !set.has('MOD') && !set.has('REGISTERED'),
  CREATOR: (set) => !set.has('CREATOR'),
};

interface Quota {
  quota: number;
  target: RestrictionTarget;
  reset_strategy: {
    strategy: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    multiplier: number;
  };
  last_reset: Date;
  end_time: Date;
  timezone: string;
}

interface TimeRestriction {
  start_time: Date;
  end_time: Date;
  target: RestrictionTarget;
  repeat_strategy: {
    strategy: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    multiplier: number;
  };
  timezone: string;
}

@Component({
  selector: 'app-restrictions-manage',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatListModule,
    MatInputModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatTimepickerModule,
    MatDatepickerModule,
    ContextPipe,
    MatProgressSpinnerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './restrictions-manage.component.html',
  styleUrl: './restrictions-manage.component.scss',
})
export class RestrictionsManageComponent {
  readonly restrictionsId = input(null as UUID | null);
  readonly mode = input.required<'room' | 'user'>();
  readonly i18n = i18n;
  readonly TARGETS = TARGETS;
  protected readonly currentDate = new Date();
  protected readonly currentTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  protected readonly blockedTargets = signal([] as RestrictionTarget[]);
  readonly blockOptions: Signal<RestrictionTarget[]> = computed(() =>
    this.filterBlock(),
  );
  private formBuilder = inject(FormBuilder);
  readonly inputQuota = this.formBuilder.group({
    quota: [
      0,
      [
        Validators.required,
        Validators.min(0),
        (control) => {
          if (!control.value?.toString().match(/^\d+(\.\d{1,2})?$/)) {
            return { pattern: true };
          }
          return null;
        },
      ],
    ],
    target: ['ALL' as RestrictionTarget, Validators.required],
    strategy: [
      'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
      Validators.required,
    ],
    multiplier: [1, [Validators.required, Validators.min(1)]],
    lastReset: [new Date(), Validators.required],
    endTime: [null as Date],
  });
  protected readonly quotas = signal([] as Quota[]);
  readonly inputTime = this.formBuilder.group({
    startTime: [new Date(), Validators.required],
    endTime: [
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      Validators.required,
    ],
    target: ['ALL' as RestrictionTarget, Validators.required],
    strategy: [
      'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
      Validators.required,
    ],
    multiplier: [1, [Validators.required, Validators.min(1)]],
  });
  protected readonly times = signal([] as TimeRestriction[]);
  protected readonly saving = signal(false);
  private previousQuotas: QuotaRestriction[] = [];
  private previousBlocks: BlockRestriction[] = [];
  private previousTimes: TR[] = [];
  private readonly restriction = inject(AssistantRestrictionService);
  private readonly notify = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  constructor() {
    effect(() => {
      this._adapter.setLocale(language());
    });
    effect(() => {
      const id = this.restrictionsId();
      this.times.set([]);
      this.quotas.set([]);
      this.blockedTargets.set([]);
      this.previousBlocks = null;
      this.previousQuotas = null;
      this.previousTimes = null;
      if (id) {
        this.loadRestrictions(id);
      }
    });
  }

  static open(
    dialog: MatDialog,
    restrictionsId: UUID | null,
    mode: 'room' | 'user',
  ) {
    const ref = dialog.open(RestrictionsManageComponent, {
      width: '100%',
      height: '100%',
      panelClass: 'full-screen-dialog',
    });
    ref.componentRef.setInput('restrictionsId', restrictionsId);
    ref.componentRef.setInput('mode', mode);
    return ref;
  }

  protected transformCurrency(num: number) {
    return Intl.NumberFormat(language(), {
      currency: 'USD',
      currencyDisplay: 'symbol',
      minimumIntegerDigits: 1,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: 'currency',
    }).format(num);
  }

  protected transformDate(date: Date): string {
    return date.toLocaleDateString(language(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  protected transformTime(date: Date): string {
    return date.toLocaleTimeString(language(), {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected transformRepetiton(strategy: Quota['reset_strategy']): string {
    if (strategy.multiplier > 1) {
      return i18nContext(i18n().infoMoreRepetition[strategy.strategy], {
        repetitionMultiplier: String(strategy.multiplier),
      });
    }
    return i18n().repetitionUnits[strategy.strategy];
  }

  protected addTime() {
    if (this.inputTime.invalid) {
      return;
    }
    const newTime: TimeRestriction = {
      start_time: this.inputTime.value.startTime,
      end_time: this.inputTime.value.endTime,
      target: this.inputTime.value.target,
      repeat_strategy: {
        strategy: this.inputTime.value.strategy,
        multiplier: this.inputTime.value.multiplier,
      },
      timezone: this.currentTimezone,
    };
    this.inputTime.reset({
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      target: 'ALL',
      strategy: 'monthly',
      multiplier: 1,
    });
    this.times.update((times) => [...times, newTime]);
  }

  protected removeTime(time: TimeRestriction) {
    this.times.update((times) => times.filter((t) => t !== time));
  }

  protected addQuota() {
    if (this.inputQuota.invalid) {
      return;
    }
    const newQuota: Quota = {
      quota: this.inputQuota.value.quota,
      target: this.inputQuota.value.target,
      reset_strategy: {
        strategy: this.inputQuota.value.strategy,
        multiplier: this.inputQuota.value.multiplier,
      },
      last_reset: this.inputQuota.value.lastReset,
      end_time: this.inputQuota.value.endTime,
      timezone: this.currentTimezone,
    };
    this.inputQuota.reset({
      quota: 0,
      target: 'ALL',
      strategy: 'monthly',
      multiplier: 1,
      lastReset: new Date(),
      endTime: null,
    });
    this.quotas.update((quotas) => [...quotas, newQuota]);
  }

  protected removeQuota(quota: Quota) {
    this.quotas.update((quotas) => quotas.filter((q) => q !== quota));
  }

  protected compress(set: Set<RestrictionTarget>): RestrictionTarget[] {
    // compress user group
    if (set.has('UNREGISTERED') && set.has('REGISTERED')) {
      set.clear();
      set.add('ALL');
    }
    if (set.has('UNREGISTERED_USER') && set.has('REGISTERED_USER')) {
      set.delete('UNREGISTERED_USER');
      set.delete('REGISTERED_USER');
      set.add('USER');
    }
    if (set.has('UNREGISTERED_MOD') && set.has('REGISTERED_MOD')) {
      set.delete('UNREGISTERED_MOD');
      set.delete('REGISTERED_MOD');
      set.add('MOD');
    }
    // compress user groups
    if (set.has('MOD') && set.has('USER') && set.has('CREATOR')) {
      set.clear();
      set.add('ALL');
    }
    // compress registered class
    if (set.has('UNREGISTERED_MOD') && set.has('UNREGISTERED_USER')) {
      set.delete('UNREGISTERED_MOD');
      set.delete('UNREGISTERED_USER');
      set.add('UNREGISTERED');
    }
    if (
      set.has('REGISTERED_MOD') &&
      set.has('REGISTERED_USER') &&
      set.has('CREATOR')
    ) {
      set.delete('REGISTERED_MOD');
      set.delete('REGISTERED_USER');
      set.delete('CREATOR');
      set.add('REGISTERED');
    }
    // compress registered classes
    if (set.has('UNREGISTERED') && set.has('REGISTERED')) {
      set.clear();
      set.add('ALL');
    }
    // bug when selecting at end
    if (set.has('ALL')) {
      set.clear();
      set.add('ALL');
    }
    return Array.from(set);
  }

  protected addBlock(target: RestrictionTarget) {
    const set = new Set(this.blockedTargets());
    set.add(target);
    this.blockedTargets.set(this.compress(set));
  }

  protected removeBlock(target: RestrictionTarget) {
    this.blockedTargets.update((blocked) =>
      blocked.filter((b) => b !== target),
    );
  }

  protected transformTarget(target: RestrictionTarget): string {
    const text = i18n();
    switch (target) {
      case 'ALL':
        return text.userTargets.all;
      case 'UNREGISTERED':
        return text.userTargets.unregistered;
      case 'REGISTERED':
        return text.userTargets.registered;
      case 'USER':
        return text.userTargets.user;
      case 'UNREGISTERED_USER':
        return text.userTargets.unregisteredUser;
      case 'REGISTERED_USER':
        return text.userTargets.registeredUser;
      case 'MOD':
        return text.userTargets.moderator;
      case 'UNREGISTERED_MOD':
        return text.userTargets.unregisteredModerator;
      case 'REGISTERED_MOD':
        return text.userTargets.registeredModerator;
      case 'CREATOR':
        return text.userTargets.creator;
    }
  }

  protected save() {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.saveRestrictions().subscribe({
      next: (id) => {
        this.saving.set(false);
        this.dialogRef.close(id);
        this.notify.show(i18n().global.changeSuccessful);
      },
      error: (e) => {
        console.error(e);
        this.saving.set(false);
        this.notify.show(i18n().global.changesGoneWrong);
      },
    });
  }

  private filterBlock(): RestrictionTarget[] {
    const blocked = this.blockedTargets();
    const set = new Set(blocked.map((b) => b));
    if (set.has('ALL')) {
      return [];
    }
    return TARGETS.filter((v) => FILTER_OBJECT[v](set));
  }

  private parseRepeatStrategy(strategy: string): Quota['reset_strategy'] {
    const regex = /^(\d+)(d|w|m|y)$/;
    const match = strategy.match(regex);
    if (!match) {
      return { strategy: 'never', multiplier: 1 };
    }
    let strategyValue: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    switch (match[2]) {
      case 'd':
        strategyValue = 'daily';
        break;
      case 'w':
        strategyValue = 'weekly';
        break;
      case 'm':
        strategyValue = 'monthly';
        break;
      case 'y':
        strategyValue = 'yearly';
        break;
      default:
        strategyValue = 'never';
    }
    return { strategy: strategyValue, multiplier: Number(match[1]) };
  }

  private loadRestrictions(id: UUID) {
    const blockObservable: Observable<BlockRestriction[]> =
      this.mode() === 'room'
        ? this.restriction.listBlockRestrictionsForRoom(id)
        : this.restriction.listBlockRestrictionsForUser(id);
    blockObservable.subscribe((blocks) => {
      this.previousBlocks = blocks;
      this.blockedTargets.set(blocks.map((b) => b.target));
    });
    const quotaObservable: Observable<QuotaRestriction[]> =
      this.mode() === 'room'
        ? this.restriction.listQuotaRestrictionsForRoom(id)
        : this.restriction.listQuotaRestrictionsForUser(id);
    quotaObservable.subscribe((quotas) => {
      this.previousQuotas = quotas;
      this.quotas.set(
        quotas.map(
          (q) =>
            ({
              quota: Number(q.quota),
              target: q.target,
              reset_strategy: this.parseRepeatStrategy(q.reset_strategy),
              last_reset: new Date(q.last_reset),
              end_time: new Date(q.end_time),
              timezone: q.timezone,
            }) satisfies Quota,
        ),
      );
    });
    const timeObservable: Observable<TR[]> =
      this.mode() === 'room'
        ? this.restriction.listTimeRestrictionsForRoom(id)
        : this.restriction.listTimeRestrictionsForUser(id);
    timeObservable.subscribe((times) => {
      this.previousTimes = times;
      this.times.set(
        times.map(
          (t) =>
            ({
              start_time: new Date(t.start_time),
              end_time: new Date(t.end_time),
              target: t.target,
              repeat_strategy: this.parseRepeatStrategy(t.repeat_strategy),
              timezone: t.timezone,
            }) satisfies TimeRestriction,
        ),
      );
    });
  }

  private saveRestrictions() {
    const id = this.restrictionsId();
    let start = of(id);
    if (!id) {
      start = (
        this.mode() === 'room'
          ? this.restriction.createRoomRestriction(room().id)
          : this.restriction.createUserRestriction(user().id)
      ).pipe(map((r) => r.id));
    }
    return start.pipe(
      concatMap((restriction_id) =>
        forkJoin([
          this.saveBlocks(restriction_id),
          this.saveQuotas(restriction_id),
          this.saveTimes(restriction_id),
        ]).pipe(map(() => restriction_id)),
      ),
    );
  }

  private saveBlocks(restriction_id: UUID) {
    const previousBlocked = new Set(this.previousBlocks?.map((b) => b.target));
    const toCreate: InputBlockRestriction[] = [];
    for (const block of this.blockedTargets()) {
      if (previousBlocked.delete(block)) {
        // Already present
        continue;
      }
      // new block
      toCreate.push({ target: block, restriction_id });
    }
    const toDelete =
      this.previousBlocks?.filter((b) => previousBlocked.has(b.target)) ?? [];
    // patching
    let start: Observable<unknown> = of(null);
    if (toDelete.length > 0) {
      start = forkJoin(
        toDelete.map((block) =>
          this.mode() === 'room'
            ? this.restriction.deleteBlockRestrictionForRoom(
                restriction_id,
                block.id,
              )
            : this.restriction.deleteBlockRestrictionForUser(
                restriction_id,
                block.id,
              ),
        ),
      );
    }
    if (toCreate.length > 0) {
      start = start.pipe(
        concatMap(() =>
          forkJoin(
            toCreate.map((block) =>
              this.mode() === 'room'
                ? this.restriction.createBlockRestrictionForRoom(block)
                : this.restriction.createBlockRestrictionForUser(block),
            ),
          ),
        ),
      );
    }
    return start;
  }

  private areQuotasEqual(a: QuotaRestriction, b: Quota): boolean {
    return (
      a.quota === String(b.quota) &&
      a.target === b.target &&
      a.reset_strategy ===
        b.reset_strategy.multiplier + b.reset_strategy.strategy[0] &&
      a.last_reset === b.last_reset &&
      a.end_time === b.end_time &&
      a.timezone === b.timezone
    );
  }

  private saveQuotas(restriction_id: UUID) {
    let previousQuotas = this.previousQuotas ?? [];
    const toCreate: InputQuotaRestriction[] = [];
    for (const quota of this.quotas()) {
      const before = previousQuotas.length;
      previousQuotas = previousQuotas.filter((q) =>
        this.areQuotasEqual(q, quota),
      );
      if (before !== previousQuotas.length) {
        // Already present
        continue;
      }
      // new quota
      toCreate.push({
        target: quota.target,
        quota: String(quota.quota),
        reset_strategy:
          quota.reset_strategy.multiplier + quota.reset_strategy.strategy[0],
        last_reset: quota.last_reset,
        end_time: quota.end_time,
        restriction_id,
        timezone: this.currentTimezone,
      });
    }
    const toDelete = previousQuotas;
    // patching
    let start: Observable<unknown> = of(null);
    if (toDelete.length > 0) {
      start = forkJoin(
        toDelete.map((quota) =>
          this.mode() === 'room'
            ? this.restriction.deleteQuotaRestrictionForRoom(
                restriction_id,
                quota.id,
              )
            : this.restriction.deleteQuotaRestrictionForUser(
                restriction_id,
                quota.id,
              ),
        ),
      );
    }
    if (toCreate.length > 0) {
      start = start.pipe(
        concatMap(() =>
          forkJoin(
            toCreate.map((quota) =>
              this.mode() === 'room'
                ? this.restriction.createQuotaRestrictionForRoom(quota)
                : this.restriction.createQuotaRestrictionForUser(quota),
            ),
          ),
        ),
      );
    }
    return start;
  }

  private areTimesEqual(a: TR, b: TimeRestriction): boolean {
    return (
      a.start_time === b.start_time &&
      a.end_time === b.end_time &&
      a.target === b.target &&
      a.repeat_strategy ===
        b.repeat_strategy.multiplier + b.repeat_strategy.strategy[0] &&
      a.timezone === b.timezone
    );
  }

  private saveTimes(restriction_id: UUID) {
    let previousTimes = this.previousTimes ?? [];
    const toCreate: InputTimeRestriction[] = [];
    for (const time of this.times()) {
      const before = previousTimes.length;
      previousTimes = previousTimes.filter((t) => this.areTimesEqual(t, time));
      if (before !== previousTimes.length) {
        // Already present
        continue;
      }
      // new time
      toCreate.push({
        restriction_id,
        start_time: time.start_time,
        end_time: time.end_time,
        target: time.target,
        repeat_strategy:
          time.repeat_strategy.multiplier + time.repeat_strategy.strategy[0],
        timezone: time.timezone,
      });
    }
    const toDelete = previousTimes;
    // patching
    let start: Observable<unknown> = of(null);
    if (toDelete.length > 0) {
      start = forkJoin(
        toDelete.map((time) =>
          this.mode() === 'room'
            ? this.restriction.deleteTimeRestrictionForRoom(
                restriction_id,
                time.id,
              )
            : this.restriction.deleteTimeRestrictionForUser(
                restriction_id,
                time.id,
              ),
        ),
      );
    }
    if (toCreate.length > 0) {
      start = start.pipe(
        concatMap(() =>
          forkJoin(
            toCreate.map((time) =>
              this.mode() === 'room'
                ? this.restriction.createTimeRestrictionForRoom(time)
                : this.restriction.createTimeRestrictionForUser(time),
            ),
          ),
        ),
      );
    }
    return start;
  }
}
