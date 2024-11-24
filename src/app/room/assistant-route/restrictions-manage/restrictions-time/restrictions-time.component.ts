import rawI18n from '../i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  Signal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AssistantRestrictionService,
  InputTimeRestriction,
  PatchTimeRestriction,
  RESTRICTION_TARGETS,
  RestrictionTarget,
  TimeRestriction,
} from '../../services/assistant-restriction.service';
import {
  decodeRepeatStrategy,
  parseRepeatStrategy,
  RepeatStrategy,
  transformDate,
  transformTarget,
  transformTime,
} from '../util';
import { UUID } from 'app/utils/ts-utils';
import { DateAdapter } from '@angular/material/core';
import { language } from 'app/base/language/language';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { concatMap, forkJoin, Observable, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

interface Time {
  start_time: Date;
  end_time: Date;
  target: RestrictionTarget;
  repeat_strategy: RepeatStrategy;
  timezone: string;
  meta: {
    id: UUID;
    title: string;
    lines: string[];
  };
}

interface TargetOption {
  target: RestrictionTarget;
  text: string;
}

type GetSignalType<T> = T extends Signal<infer U> ? U : never;

@Component({
  selector: 'app-restrictions-time',
  imports: [
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './restrictions-time.component.html',
  styleUrls: ['../restrictions-manage.component.scss'],
})
export class RestrictionsTimeComponent {
  timeRestrictions = input.required<TimeRestriction[]>();
  mode = input.required<'room' | 'user'>();
  protected readonly i18n = i18n;
  protected readonly targets = signal<TargetOption[]>([]);
  private formBuilder = inject(FormBuilder);
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
  protected readonly preEditValue = signal<typeof this.inputTime.value>(null);
  protected readonly currentEditTime = signal<Time>(null);
  protected readonly times = signal([] as Time[]);
  private readonly currentTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  private readonly adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private readonly restriction = inject(AssistantRestrictionService);
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('listRef');
  private readonly formRef = viewChild<ElementRef<HTMLElement>>('formRef');

  constructor() {
    // language change
    effect(() => {
      this.adapter.setLocale(language());
    });
    // i18n change
    effect(() => {
      const i18n = this.i18n();
      this.targets.set(
        RESTRICTION_TARGETS.map((target) => ({
          target,
          text: transformTarget(i18n.userTargets, target),
        })),
      );
      const elements = untracked(() => this.times());
      elements.forEach((q) => this.updateMeta(i18n, q));
      this.times.set([...elements]);
    });
    // input change
    effect(() => {
      const elements = this.timeRestrictions();
      this.preEditValue.set(null);
      this.currentEditTime.set(null);
      untracked(() => this.reset());
      const newElements = elements.map(
        (t) =>
          ({
            start_time: new Date(t.start_time),
            end_time: new Date(t.end_time),
            target: t.target,
            repeat_strategy: parseRepeatStrategy(t.repeat_strategy),
            timezone: t.timezone,
            meta: {
              id: t.id,
              title: '',
              lines: [],
            },
          }) satisfies Time,
      );
      const lang = untracked(() => this.i18n());
      newElements.forEach((t) => this.updateMeta(lang, t));
      this.times.set(newElements);
    });
  }

  saveTimes(restriction_id: UUID) {
    const previousTimes = this.timeRestrictions();
    const set = new Set(this.times());
    const patches: PatchTimeRestriction[] = [];
    this.removeFromTimesWithId(previousTimes, set, patches);
    this.removeFromTimesWithEquality(previousTimes, set);
    const toCreate: InputTimeRestriction[] = [];
    for (const time of set) {
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
    const toPatch = patches.filter(Boolean);
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
    if (toPatch.length > 0) {
      start = start.pipe(
        concatMap(() =>
          forkJoin(
            toPatch.map((patch) =>
              this.mode() === 'room'
                ? this.restriction.patchTimeRestrictionForRoom(
                    restriction_id,
                    patch,
                  )
                : this.restriction.patchTimeRestrictionForUser(
                    restriction_id,
                    patch,
                  ),
            ),
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

  protected cancelEdit() {
    this.reset();
  }

  protected editTime(time: Time) {
    this.preEditValue.set(this.inputTime.value);
    this.currentEditTime.set(time);
    this.inputTime.reset({
      startTime: time.start_time,
      endTime: time.end_time,
      target: time.target,
      strategy: time.repeat_strategy.strategy,
      multiplier: time.repeat_strategy.multiplier,
    });
    this.formRef().nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  protected addTime() {
    if (this.inputTime.invalid) {
      return;
    }
    const last = this.currentEditTime();
    const newTime: Time = {
      start_time: this.inputTime.value.startTime,
      end_time: this.inputTime.value.endTime,
      target: this.inputTime.value.target,
      repeat_strategy: {
        strategy: this.inputTime.value.strategy,
        multiplier: this.inputTime.value.multiplier,
      },
      timezone: this.currentTimezone,
      meta: {
        id: last?.meta.id || null,
        title: '',
        lines: [],
      },
    };
    this.updateMeta(i18n(), newTime);
    this.reset();
    this.times.update((times) => [...times.filter((t) => t !== last), newTime]);
    this.listRef().nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  protected removeTime(time: Time) {
    this.times.update((times) => times.filter((t) => t !== time));
  }

  private makePatch(
    restriction: TimeRestriction,
    t: Time,
  ): PatchTimeRestriction {
    const patch: PatchTimeRestriction = {
      id: restriction.id,
    };
    // target
    const target = t.target;
    if (restriction.target !== target) {
      patch.target = target;
    }
    // start_time
    const start_time = t.start_time;
    if (restriction.start_time !== start_time) {
      patch.start_time = start_time;
    }
    // end_time
    const end_time = t.end_time;
    if (restriction.end_time !== end_time) {
      patch.end_time = end_time;
    }
    // repeat_strategy
    const repeat_strategy = decodeRepeatStrategy(t.repeat_strategy);
    if (restriction.repeat_strategy !== repeat_strategy) {
      patch.repeat_strategy = repeat_strategy;
    }
    // timezone
    const timezone = t.timezone;
    if (restriction.timezone !== timezone) {
      patch.timezone = timezone;
    }
    if (Object.keys(patch).length < 2) {
      return null;
    }
    return patch;
  }

  private removeFromTimesWithId(
    restrictions: TimeRestriction[],
    times: Set<Time>,
    patches: PatchTimeRestriction[],
  ) {
    for (const t of [...times]) {
      if (!t.meta.id) {
        continue;
      }
      const index = restrictions.findIndex((r) => r.id === t.meta.id);
      if (index !== -1) {
        const elem = restrictions.splice(index, 1)[0];
        times.delete(t);
        patches.push(this.makePatch(elem, t));
      }
    }
  }

  private removeFromTimesWithEquality(
    restrictions: TimeRestriction[],
    times: Set<Time>,
  ) {
    for (const t of [...times]) {
      const index = restrictions.findIndex((a) => {
        // are times equal
        return (
          a.target === t.target &&
          a.start_time === t.start_time &&
          a.end_time === t.end_time &&
          a.repeat_strategy === decodeRepeatStrategy(t.repeat_strategy) &&
          a.timezone === t.timezone
        );
      });
      if (index !== -1) {
        restrictions.splice(index, 1);
        times.delete(t);
      }
    }
  }

  private updateMeta(lang: GetSignalType<typeof i18n>, time: Time): void {
    const target = transformTarget(lang.userTargets, time.target);
    time.meta = {
      id: time.meta.id,
      title: i18nContext(lang.infoTime, {
        target,
      }),
      lines: [
        i18nContext(lang.infoTimeStart, {
          time: transformTime(time.start_time),
          date: transformDate(time.start_time),
        }),
        i18nContext(lang.infoTimeEnd, {
          time: transformTime(time.end_time),
          date: transformDate(time.end_time),
        }),
        time.timezone !== this.currentTimezone ? lang.infoWrongTimezone : null,
      ].filter(Boolean),
    };
  }

  private reset() {
    if (this.currentEditTime()) {
      this.inputTime.reset(this.preEditValue());
      this.currentEditTime.set(null);
      this.preEditValue.set(null);
      return;
    }
    this.inputTime.reset({
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      target: 'ALL',
      strategy: 'monthly',
      multiplier: 1,
    });
  }
}
