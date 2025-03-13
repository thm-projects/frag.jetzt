import rawI18n from './i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  Component,
  effect,
  inject,
  input,
  signal,
  viewChild,
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
import { ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { language } from 'app/base/language/language';
import { i18nContext } from 'app/base/i18n/i18n-context';
import { UUID } from 'app/utils/ts-utils';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AssistantRestrictionService,
  BlockRestriction,
  QuotaRestriction,
  RESTRICTION_TARGETS,
  RestrictionTarget,
  TimeRestriction,
  TimeRestriction as TR,
} from '../services/assistant-restriction.service';
import {
  concatMap,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  takeUntil,
} from 'rxjs';
import { room } from 'app/room/state/room';
import { user } from 'app/user/state/user';
import { NotificationService } from 'app/services/util/notification.service';
import { RestrictionsBlockComponent } from './restrictions-block/restrictions-block.component';
import { RepeatStrategy, transformTarget } from './util';
import { RestrictionsQuotaComponent } from './restrictions-quota/restrictions-quota.component';
import { RestrictionsTimeComponent } from './restrictions-time/restrictions-time.component';

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
    MatProgressSpinnerModule,
    RestrictionsBlockComponent,
    RestrictionsQuotaComponent,
    RestrictionsTimeComponent,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './restrictions-manage.component.html',
  styleUrl: './restrictions-manage.component.scss',
})
export class RestrictionsManageComponent {
  readonly restrictionsId = input(null as UUID | null);
  readonly mode = input.required<'room' | 'user'>();
  readonly i18n = i18n;
  readonly TARGETS = RESTRICTION_TARGETS;
  protected readonly currentDate = new Date();
  protected readonly currentTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  protected readonly saving = signal(false);
  protected readonly previousQuotas = signal<QuotaRestriction[]>([]);
  protected readonly previousBlocks = signal<BlockRestriction[]>([]);
  protected readonly previousTimes = signal<TimeRestriction[]>([]);
  private readonly blockRestrictions = viewChild.required(
    RestrictionsBlockComponent,
  );
  private readonly quotaRestrictions = viewChild.required(
    RestrictionsQuotaComponent,
  );
  private readonly timeRestrictions = viewChild.required(
    RestrictionsTimeComponent,
  );
  private readonly restriction = inject(AssistantRestrictionService);
  private readonly notify = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private emitter = new Subject<void>();

  constructor() {
    effect(() => {
      this._adapter.setLocale(language());
    });
    effect(() => {
      const id = this.restrictionsId();
      this.previousBlocks.set([]);
      this.previousQuotas.set([]);
      this.previousTimes.set([]);
      this.emitter.next();
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

  protected transformRepetiton(strategy: RepeatStrategy): string {
    if (strategy.multiplier > 1) {
      return i18nContext(i18n().infoMoreRepetition[strategy.strategy], {
        repetitionMultiplier: String(strategy.multiplier),
      });
    }
    return i18n().repetitionUnits[strategy.strategy];
  }

  protected transformTarget(target: RestrictionTarget): string {
    const text = i18n();
    return transformTarget(text.userTargets, target);
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

  private loadRestrictions(id: UUID) {
    const blockObservable: Observable<BlockRestriction[]> =
      this.mode() === 'room'
        ? this.restriction.listBlockRestrictionsForRoom(id)
        : this.restriction.listBlockRestrictionsForUser(id);
    blockObservable.pipe(takeUntil(this.emitter)).subscribe((blocks) => {
      this.previousBlocks.set(blocks);
    });
    const quotaObservable: Observable<QuotaRestriction[]> =
      this.mode() === 'room'
        ? this.restriction.listQuotaRestrictionsForRoom(id)
        : this.restriction.listQuotaRestrictionsForUser(id);
    quotaObservable.pipe(takeUntil(this.emitter)).subscribe((quotas) => {
      this.previousQuotas.set(quotas);
    });
    const timeObservable: Observable<TR[]> =
      this.mode() === 'room'
        ? this.restriction.listTimeRestrictionsForRoom(id)
        : this.restriction.listTimeRestrictionsForUser(id);
    timeObservable.pipe(takeUntil(this.emitter)).subscribe((times) => {
      this.previousTimes.set(times);
    });
  }

  private saveRestrictions() {
    const id = this.restrictionsId();
    let start = of(id);
    if (!id) {
      start = (
        this.mode() === 'room'
          ? this.restriction.createRoomRestriction(room.value().id)
          : this.restriction.createUserRestriction(user().id)
      ).pipe(map((r) => r.id));
    }
    return start.pipe(
      concatMap((restriction_id) =>
        forkJoin([
          this.blockRestrictions().saveBlocks(restriction_id),
          this.quotaRestrictions().saveQuotas(restriction_id),
          this.timeRestrictions().saveTimes(restriction_id),
        ]).pipe(map(() => restriction_id)),
      ),
    );
  }
}
