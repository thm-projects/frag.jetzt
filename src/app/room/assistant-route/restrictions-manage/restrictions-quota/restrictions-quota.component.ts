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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAdapter } from '@angular/material/core';
import { language } from 'app/base/language/language';
import {
  AssistantRestrictionService,
  InputQuotaRestriction,
  PatchQuotaRestriction,
  QuotaRestriction,
  RESTRICTION_TARGETS,
  RestrictionTarget,
} from '../../services/assistant-restriction.service';
import { UUID } from 'app/utils/ts-utils';
import { MatSelectModule } from '@angular/material/select';
import {
  decodeRepeatStrategy,
  parseRepeatStrategy,
  RepeatStrategy,
  transformCurrency,
  transformDate,
  transformRepetiton,
  transformTarget,
  transformTime,
} from '../util';
import { concatMap, forkJoin, Observable, of } from 'rxjs';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { MatInputModule } from '@angular/material/input';

interface Quota {
  quota: number;
  target: RestrictionTarget;
  reset_strategy: RepeatStrategy;
  last_reset: Date;
  end_time: Date;
  timezone: string;
  meta: {
    id: UUID;
    title: string;
    lines: string[];
    counter: number;
  };
}

interface TargetOption {
  target: RestrictionTarget;
  text: string;
}

type GetSignalType<T> = T extends Signal<infer U> ? U : never;

@Component({
  selector: 'app-restrictions-quota',
  imports: [
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatSelectModule,
    MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './restrictions-quota.component.html',
  styleUrls: ['../restrictions-manage.component.scss'],
})
export class RestrictionsQuotaComponent {
  quotaRestrictions = input.required<QuotaRestriction[]>();
  mode = input.required<'room' | 'user'>();
  protected readonly i18n = i18n;
  protected readonly targets = signal<TargetOption[]>([]);
  private readonly currentTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;
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
  protected readonly preEditValue = signal<typeof this.inputQuota.value>(null);
  protected readonly currentEditQuota = signal<Quota>(null);
  protected readonly quotas = signal([] as Quota[]);
  private readonly restriction = inject(AssistantRestrictionService);
  private readonly listRef = viewChild<ElementRef<HTMLElement>>('listRef');
  private readonly formRef = viewChild<ElementRef<HTMLElement>>('formRef');
  private readonly adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);

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
      const elements = untracked(() => this.quotas());
      elements.forEach((q) => this.updateMeta(i18n, q));
      this.quotas.set([...elements]);
    });
    // input change
    effect(() => {
      const fromAPI = this.quotaRestrictions();
      this.preEditValue.set(null);
      this.currentEditQuota.set(null);
      untracked(() => this.reset());
      const newElements = fromAPI.map(
        (q) =>
          ({
            quota: Number(q.quota),
            target: q.target,
            reset_strategy: parseRepeatStrategy(q.reset_strategy),
            last_reset: new Date(q.last_reset),
            end_time: new Date(q.end_time),
            timezone: q.timezone,
            meta: {
              id: q.id,
              title: '',
              lines: [],
              counter: Number(q.counter),
            },
          }) satisfies Quota,
      );
      const lang = untracked(() => this.i18n());
      newElements.forEach((q) => this.updateMeta(lang, q));
      this.quotas.set(newElements);
    });
    effect(() => {
      const html = this.listRef() as unknown as HTMLElement;
      console.log(html);
    });
  }

  saveQuotas(restriction_id: UUID) {
    const previousQuotas = this.quotaRestrictions();
    const set = new Set(this.quotas());
    const patches: PatchQuotaRestriction[] = [];
    this.removeFromQuotasWithId(previousQuotas, set, patches);
    this.removeFromQuotasWithEquality(previousQuotas, set);
    const toCreate: InputQuotaRestriction[] = [];
    for (const quota of set) {
      toCreate.push({
        target: quota.target,
        quota: String(quota.quota),
        reset_strategy: decodeRepeatStrategy(quota.reset_strategy),
        last_reset: quota.last_reset,
        end_time: quota.end_time,
        restriction_id,
        timezone: this.currentTimezone,
      });
    }
    const toDelete = previousQuotas;
    const toPatch = patches.filter(Boolean);
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
    if (toPatch.length > 0) {
      start = start.pipe(
        concatMap(() =>
          forkJoin(
            toPatch.map((patch) =>
              this.mode() === 'room'
                ? this.restriction.patchQuotaRestrictionForRoom(
                    restriction_id,
                    patch,
                  )
                : this.restriction.patchQuotaRestrictionForUser(
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

  protected addQuota() {
    if (this.inputQuota.invalid) {
      return;
    }
    const last = this.currentEditQuota();
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
      meta: {
        id: last?.meta.id || null,
        title: '',
        lines: [],
        counter: last?.meta.counter || 0,
      },
    };
    this.updateMeta(i18n(), newQuota);
    this.reset();
    this.quotas.update((quotas) => [
      ...quotas.filter((q) => q !== last),
      newQuota,
    ]);
    this.listRef().nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  protected cancelEdit() {
    this.reset();
  }

  protected editQuota(quota: Quota) {
    const editing = this.currentEditQuota();
    this.currentEditQuota.set(quota);
    if (!editing) {
      this.preEditValue.set(this.inputQuota.value);
    }
    this.inputQuota.reset({
      quota: quota.quota,
      target: quota.target,
      strategy: quota.reset_strategy.strategy,
      multiplier: quota.reset_strategy.multiplier,
      lastReset: quota.last_reset,
      endTime: quota.end_time,
    });
    this.formRef().nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  protected removeQuota(quota: Quota) {
    this.quotas.update((quotas) => quotas.filter((q) => q !== quota));
  }

  private makePatch(
    restriction: QuotaRestriction,
    q: Quota,
  ): PatchQuotaRestriction {
    const patch: PatchQuotaRestriction = {
      id: restriction.id,
    };
    // target
    const target = q.target;
    if (restriction.target !== target) {
      patch.target = target;
    }
    // quota
    const quota = String(q.quota);
    if (restriction.quota !== quota) {
      patch.quota = quota;
    }
    // reset_strategy
    const reset_strategy = decodeRepeatStrategy(q.reset_strategy);
    if (restriction.reset_strategy !== reset_strategy) {
      patch.reset_strategy = reset_strategy;
    }
    // last_reset
    const last_reset = q.last_reset;
    if (restriction.last_reset !== last_reset) {
      patch.last_reset = last_reset;
    }
    // end_time
    const end_time = q.end_time;
    if (restriction.end_time !== end_time) {
      patch.end_time = end_time;
    }
    // timezone
    const timezone = q.timezone;
    if (restriction.timezone !== timezone) {
      patch.timezone = timezone;
    }
    if (Object.keys(patch).length < 2) {
      return null;
    }
    return patch;
  }

  private removeFromQuotasWithId(
    restrictions: QuotaRestriction[],
    quotas: Set<Quota>,
    patches: PatchQuotaRestriction[],
  ) {
    for (const q of [...quotas]) {
      if (!q.meta.id) {
        continue;
      }
      const index = restrictions.findIndex((r) => r.id === q.meta.id);
      if (index !== -1) {
        const elem = restrictions.splice(index, 1)[0];
        quotas.delete(q);
        patches.push(this.makePatch(elem, q));
      }
    }
  }

  private removeFromQuotasWithEquality(
    restrictions: QuotaRestriction[],
    quotas: Set<Quota>,
  ) {
    for (const q of [...quotas]) {
      const index = restrictions.findIndex((a) => {
        // are quotas equal
        return (
          a.quota === String(q.quota) &&
          a.target === q.target &&
          a.reset_strategy === decodeRepeatStrategy(q.reset_strategy) &&
          a.last_reset === q.last_reset &&
          a.end_time === q.end_time &&
          a.timezone === q.timezone
        );
      });
      if (index !== -1) {
        restrictions.splice(index, 1);
        quotas.delete(q);
      }
    }
  }

  private updateMeta(lang: GetSignalType<typeof i18n>, quota: Quota): void {
    const target = transformTarget(lang.userTargets, quota.target);
    const counter = transformCurrency(quota.meta.counter);
    const quotaValue = transformCurrency(quota.quota);
    quota.meta = {
      id: quota.meta.id,
      title: i18nContext(lang.infoQuota, {
        target,
        quota: quotaValue,
        counter,
      }),
      lines: [
        i18nContext(
          quota.last_reset > new Date()
            ? lang.infoQuotaStart
            : lang.infoQuotaRepeat,
          {
            time: transformTime(quota.last_reset),
            date: transformDate(quota.last_reset),
          },
        ),
        i18nContext(lang.infoRepeatStrategy, {
          repetition: transformRepetiton(lang, quota.reset_strategy),
        }),
        quota.end_time
          ? i18nContext(
              quota.end_time >= new Date()
                ? lang.infoQuotaEnd
                : lang.infoQuotaEnded,
              {
                time: transformTime(quota.end_time),
                date: transformDate(quota.end_time),
              },
            )
          : null,
        quota.timezone !== this.currentTimezone ? lang.infoWrongTimezone : null,
      ].filter(Boolean),
      counter: quota.meta.counter,
    };
  }

  private reset() {
    if (this.currentEditQuota()) {
      this.inputQuota.reset(this.preEditValue());
      this.currentEditQuota.set(null);
      this.preEditValue.set(null);
      return;
    }
    this.inputQuota.reset({
      quota: 0,
      target: 'ALL',
      strategy: 'monthly',
      multiplier: 1,
      lastReset: new Date(),
      endTime: null,
    });
  }
}
