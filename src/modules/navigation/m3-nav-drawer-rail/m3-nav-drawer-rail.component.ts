import {
  AfterViewInit,
  Component,
  Injector,
  Signal,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDrawer,
  MatDrawerContainer,
  MatDrawerMode,
} from '@angular/material/sidenav';
import { windowWatcher } from '../utils/window-watcher';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { M3LabelButton } from 'modules/m3/components/buttons/label-button';
import { M3Icon, M3Label } from 'modules/m3/components/buttons/base';
import {
  M3NavigationOptionSection,
  M3NavigationTemplate,
} from '../m3-navigation.types';
import { CommonModule } from '@angular/common';
import { InternalTemplate } from '../m3-navigation/m3-navigation.component';

interface RailDrawerEntry {
  title: string;
  icon: string;
  onClick: () => void;
  activated: boolean;
  forward?: boolean;
}

interface Section {
  title?: string;
  tracker: any;
  options: RailDrawerEntry[];
}

const MAIN_TRACKER = 0;
const RAIL_TRACKER = 1;

@Component({
  selector: 'm3-nav-drawer-rail',
  standalone: true,
  imports: [
    MatDrawer,
    MatDrawerContainer,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    M3LabelButton,
    M3Icon,
    M3Label,
    CommonModule,
  ],
  templateUrl: './m3-nav-drawer-rail.component.html',
  styleUrl: './m3-nav-drawer-rail.component.scss',
})
export class M3NavDrawerRailComponent implements AfterViewInit {
  data = input<InternalTemplate>();
  drawerOpen: Signal<boolean>;
  protected stack = signal<M3NavigationOptionSection[]>([]);
  /**
   *
   * menu -> (click on entry -> push stack, offset = 1)
   * (menu, stack[0]) -> timeout -> offset = 0
   * (stack[0])
   *
   * case 0:
   * stack[0] -> click on next -> push stack, offset = 1
   * (stack[0], stack[1]) -> timeout -> offset = 0
   * (stack[1])
   *
   * case 1:
   * (stack[0]) -> click on prev -> offset = -1
   * (menu, stack[0]) -> timeout -> offset = 0, pop stack
   * (menu)
   */
  protected stateOffset = signal<-1 | 0 | 1>(0);
  protected railBarData = computed(() => {
    const offset = this.stateOffset();
    return this.getStateData(offset == 1);
  });
  protected animData = computed(() => {
    const offset = this.stateOffset();
    if (offset == 0) {
      return [] as Section[];
    }
    return this.getStateData(offset == -1);
  });
  protected openState = signal<'drawer' | 'rail' | 'none'>(
    this.supportsRail() ? 'rail' : 'none',
  );
  protected hasFabButton = computed(() => {
    const offset = this.stateOffset();
    if (offset === 1) return false;
    return this.stack().length + offset < 1;
  });
  protected mode: Signal<MatDrawerMode> = computed(() => {
    return windowWatcher.windowState() === 'compact' &&
      this.openState() === 'drawer'
      ? 'over'
      : 'side';
  });
  protected finishLastAnim: (() => void) | null;
  protected drawer = viewChild(MatDrawer);
  private injector = inject(Injector);

  constructor() {
    effect(
      () => {
        const rails = this.supportsRail();
        untracked(() => {
          const state = this.openState();
          if (state === 'rail' && !rails) {
            this.openState.set('none');
          } else if (state === 'none' && rails) {
            this.openState.set('rail');
          }
        });
      },
      { injector: this.injector },
    );
    this.drawerOpen = computed(() => {
      return this.openState() === 'drawer';
    });
  }

  ngAfterViewInit(): void {
    const drawer = this.drawer();
    effect(
      () => {
        const state = this.openState();
        if (state !== 'none' && !drawer.opened) {
          drawer.open();
        } else if (state === 'none' && drawer.opened) {
          drawer.close();
        }
        untracked(() => {
          if (
            state !== 'drawer' &&
            (this.stack().length > 0 || this.stateOffset() !== 0)
          ) {
            this.stack.set([]);
            this.stateOffset.set(0);
            this.finishLastAnim = null;
          }
        });
      },
      { injector: this.injector },
    );
    drawer.closedStart.subscribe(() => {
      if (this.supportsRail()) {
        this.openState.set('rail');
        drawer.open();
      } else {
        this.openState.set('none');
      }
    });
  }

  open() {
    this.openState.set('drawer');
  }

  close() {
    this.openState.set('none');
  }

  protected animationEnded() {
    this.finishLastAnim?.();
    this.finishLastAnim = null;
  }

  protected backward() {
    this.finishLastAnim?.();
    this.stateOffset.set(-1);
    this.finishLastAnim = () => {
      this.stack.update((stack) => {
        return stack.slice(0, stack.length - 1);
      });
      this.stateOffset.set(0);
    };
  }

  protected forward(e: M3NavigationOptionSection) {
    this.finishLastAnim?.();
    this.stack.update((stack) => {
      return [...stack, e];
    });
    this.stateOffset.set(1);
    this.finishLastAnim = () => this.stateOffset.set(0);
  }

  private getStateData(previous: boolean): Section[] {
    const data = this.data();
    if (!data) {
      return [] as Section[];
    }
    const barData = [] as Section[];
    const state = this.openState();
    if (state !== 'drawer') {
      this.appendRailEntry(barData, data);
      return barData;
    }
    const stack = this.stack();
    if (stack.length > Number(previous)) {
      this.appendStackEntry(barData, stack, previous);
      return barData;
    }
    this.appendDrawerEntry(barData, data);
    return barData;
  }

  private appendDrawerEntry(barData: Section[], data: InternalTemplate) {
    barData.push({
      tracker: MAIN_TRACKER,
      options: data.navigations.map((nav) => ({
        title: nav.title,
        icon: nav.icon,
        onClick: nav.onClick,
        activated: nav.activated,
      })),
    });
    for (const entry of data.options) {
      barData.push({
        title: entry.title,
        tracker: entry,
        options: entry.options.map((opt) => ({
          title: opt.title,
          icon: opt.icon,
          onClick: 'onClick' in opt ? opt.onClick : () => this.forward(opt),
          activated: false,
          forward: 'options' in opt,
        })),
      });
    }
  }

  private appendRailEntry(barData: Section[], data: InternalTemplate) {
    const maxElements = 7;
    const navs = data.navigations.slice(0, maxElements);
    const index = data.navigations.findIndex((e) => e.activated);
    if (index > maxElements - 1) {
      navs[maxElements - 1] = data.navigations[index];
    }
    barData.push({
      tracker: RAIL_TRACKER,
      options: navs.map((nav) => ({
        title: nav.title,
        icon: nav.icon,
        onClick: nav.onClick,
        activated: nav.activated,
      })),
    });
  }

  private appendStackEntry(
    barData: Section[],
    stack: M3NavigationOptionSection[],
    previous: boolean,
  ) {
    const index = previous ? stack.length - 2 : stack.length - 1;
    const tracker = stack[index];
    const options = tracker.options.map((opt) => ({
      title: opt.title,
      icon: opt.icon,
      onClick: 'onClick' in opt ? opt.onClick : () => this.forward(opt),
      activated: false,
      forward: 'options' in opt,
    }));
    options.unshift({
      title: index < 1 ? 'Main Menu' : stack[index - 1].title,
      icon: 'arrow_back',
      onClick: () => this.backward(),
      activated: true,
      forward: false,
    });
    barData.push({
      tracker,
      options,
    });
  }

  private supportsRail(): boolean {
    return this.data()?.preferedNavigation.type === 'rail';
  }
}
