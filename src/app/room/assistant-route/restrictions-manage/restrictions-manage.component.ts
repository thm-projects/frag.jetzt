import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  computed,
  effect,
  inject,
  Signal,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './restrictions-manage.component.html',
  styleUrl: './restrictions-manage.component.scss',
})
export class RestrictionsManageComponent {
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
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  constructor() {
    effect(() => {
      this._adapter.setLocale(language());
    });
  }

  static open(dialog: MatDialog) {
    const ref = dialog.open(RestrictionsManageComponent, {
      width: '100%',
      height: '100%',
      panelClass: 'full-screen-dialog',
    });
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
      timezone: 'UTC', //this.currentTimezone,
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

  private filterBlock(): RestrictionTarget[] {
    const blocked = this.blockedTargets();
    const set = new Set(blocked.map((b) => b));
    if (set.has('ALL')) {
      return [];
    }
    return TARGETS.filter((v) => FILTER_OBJECT[v](set));
  }
}
