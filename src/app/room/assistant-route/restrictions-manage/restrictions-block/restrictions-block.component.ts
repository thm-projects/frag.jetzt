import rawI18n from '../i18n.json';
import { I18nLoader } from 'app/base/i18n/i18n-loader';
const i18n = I18nLoader.load(rawI18n);
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  Signal,
  signal,
  untracked,
} from '@angular/core';
import {
  AssistantRestrictionService,
  BlockRestriction,
  InputBlockRestriction,
  RESTRICTION_TARGETS,
  RestrictionTarget,
} from '../../services/assistant-restriction.service';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { transformTarget } from '../util';
import { UUID } from 'app/utils/ts-utils';
import { concatMap, forkJoin, Observable, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

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

interface BlockedOption {
  target: RestrictionTarget;
  text: string;
}

@Component({
  selector: 'app-restrictions-block',
  imports: [
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './restrictions-block.component.html',
  styleUrls: ['../restrictions-manage.component.scss'],
})
export class RestrictionsBlockComponent {
  blockedRestrictions = input.required<BlockRestriction[]>();
  mode = input.required<'room' | 'user'>();
  protected readonly i18n = i18n;
  protected readonly blockedTargets = signal([] as BlockedOption[]);
  protected readonly blockOptions: Signal<BlockedOption[]> = computed(() =>
    this.filterBlock(),
  );
  private readonly restriction = inject(AssistantRestrictionService);

  constructor() {
    // When new restrictions come
    effect(() => {
      const fromAPI = this.blockedRestrictions();
      const i18n = untracked(() => this.i18n());
      this.blockedTargets.set(
        fromAPI.map((v) => ({
          target: v.target,
          text: transformTarget(i18n.userTargets, v.target),
        })),
      );
    });
    // When language changes
    effect(() => {
      const i18n = this.i18n();
      const targets = untracked(() => this.blockedTargets());
      this.blockedTargets.set(
        targets.map((target) => ({
          ...target,
          text: transformTarget(i18n.userTargets, target.target),
        })),
      );
    });
  }

  saveBlocks(restriction_id: UUID) {
    const previousBlocked = new Set(
      this.blockedRestrictions().map((b) => b.target),
    );
    const toCreate: InputBlockRestriction[] = [];
    for (const block of this.blockedTargets()) {
      if (previousBlocked.delete(block.target)) {
        // Already present
        continue;
      }
      // new block
      toCreate.push({ target: block.target, restriction_id });
    }
    const toDelete =
      this.blockedRestrictions().filter((b) => previousBlocked.has(b.target)) ??
      [];
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

  protected addBlock(target: RestrictionTarget) {
    const set = new Set(this.blockedTargets().map((b) => b.target));
    set.add(target);
    this.blockedTargets.set(this.compress(set));
  }

  protected removeBlock(target: RestrictionTarget) {
    this.blockedTargets.update((blocked) =>
      blocked.filter((b) => b.target !== target),
    );
  }

  private compress(set: Set<RestrictionTarget>): BlockedOption[] {
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
    const i18n = this.i18n();
    return Array.from(set).map((v) => ({
      target: v,
      text: transformTarget(i18n.userTargets, v),
    }));
  }

  private filterBlock(): BlockedOption[] {
    const blocked = this.blockedTargets();
    const i18n = this.i18n();
    const set = new Set(blocked.map((b) => b.target));
    if (set.has('ALL')) {
      return [];
    }
    return RESTRICTION_TARGETS.filter((v) => FILTER_OBJECT[v](set)).map(
      (v) => ({
        target: v,
        text: transformTarget(i18n.userTargets, v),
      }),
    );
  }
}
