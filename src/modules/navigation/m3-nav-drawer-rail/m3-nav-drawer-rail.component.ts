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
import {
  M3NavigationEntry,
  M3NavigationNestedOptionSection,
  getById,
} from '../m3-navigation.types';
import { CommonModule, Location } from '@angular/common';
import { M3LabelComponent } from '../m3-label/m3-label.component';
import {
  FAB_BUTTON,
  NAVIGATION,
  PREFERRED_NAVIGATION,
} from '../m3-navigation-emitter';
import { Router } from '@angular/router';
import { I18nLoader } from 'app/base/i18n/i18n-loader';

import rawI18n from './i18n.json';
const i18n = I18nLoader.loadModule(rawI18n);

interface RailDrawerEntry {
  title: string;
  icon: string;
  svgIcon: string;
  onClick: () => void;
  activated: boolean;
  forward?: boolean;
  switchState?: boolean;
}

interface Section {
  title?: string;
  tracker: any;
  options: RailDrawerEntry[];
}

const RAIL_TRACKER = 0;
const BACK_TRACKER = 1;

@Component({
  selector: 'm3-nav-drawer-rail',
  standalone: true,
  imports: [
    MatDrawer,
    MatDrawerContainer,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    CommonModule,
    M3LabelComponent,
  ],
  templateUrl: './m3-nav-drawer-rail.component.html',
  styleUrl: './m3-nav-drawer-rail.component.scss',
})
export class M3NavDrawerRailComponent implements AfterViewInit {
  drawerOpen: Signal<boolean>;
  protected readonly i18n = i18n;
  protected preferredNavigation = PREFERRED_NAVIGATION.asReadonly();
  protected navigation = NAVIGATION.asReadonly();
  protected fab = FAB_BUTTON.asReadonly();
  protected showBack = input(true);
  protected isSmall = computed(() => windowWatcher.windowState() === 'compact');
  protected stack = signal<M3NavigationNestedOptionSection['id'][]>([]);
  protected drawerTitle = computed(() => {
    const stack = this.stack();
    const navigation = this.navigation();
    if (!navigation) {
      return null;
    }
    if (stack.length) {
      return getById(navigation, this.makeId(stack.length)).title;
    }
    return navigation.title;
  });
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
    this.isSmall() ? 'none' : 'rail',
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
  private router = inject(Router);
  private location = inject(Location);

  constructor() {
    // TODO: Fix not updating properly because of zone.js
    effect(
      () => {
        this.railBarData();
      },
      { injector: this.injector },
    );
    effect(
      () => {
        const rails = !this.isSmall();
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
      if (!this.isSmall()) {
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
        if (stack.length < 3) {
          return [];
        }
        return stack.slice(0, stack.length - 1);
      });
      this.stateOffset.set(0);
    };
  }

  forward(parentId: string, e: M3NavigationNestedOptionSection) {
    this.finishLastAnim?.();
    if (this.openState() !== 'drawer') {
      this.openState.set('drawer');
    }
    this.stack.update((stack) => {
      if (stack.length > 0) {
        return [...stack, e.id];
      } else {
        return [parentId, e.id];
      }
    });
    this.stateOffset.set(1);
    this.finishLastAnim = () => this.stateOffset.set(0);
  }

  protected onNavClick(clickAction?: () => boolean) {
    if (clickAction?.()) {
      this.close();
    }
  }

  private getStateData(previous: boolean): Section[] {
    const barData = [] as Section[];
    const state = this.openState();
    if (state === 'none') {
      return barData;
    }
    if (state === 'rail') {
      this.appendRailEntry(barData);
      return barData;
    }
    const stack = this.stack();
    if (stack.length > Number(previous) * 2) {
      this.appendStackEntry(barData, stack, previous);
      return barData;
    }
    this.appendDrawerEntry(barData);
    return barData;
  }

  private appendDrawerEntry(barData: Section[]) {
    if (this.canGoBack() && this.showBack()) {
      barData.push({
        tracker: BACK_TRACKER,
        options: [
          {
            title: i18n().back,
            icon: 'arrow_back',
            svgIcon: '',
            onClick: () => {
              this.location.back();
              return true;
            },
            activated: false,
            forward: false,
          },
        ],
      });
    }
    this.navigation()?.sections.forEach((entry) => {
      if (entry.kind === 'navigation') {
        barData.push({
          tracker: entry.id,
          title: entry.title,
          options: entry.entries.map((nav) => ({
            title: nav.title,
            icon: nav.icon,
            svgIcon: nav.svgIcon,
            forward: nav.activated && 'options' in nav,
            onClick:
              nav.activated && 'options' in nav
                ? () =>
                    this.forward(
                      entry.id,
                      nav as M3NavigationNestedOptionSection,
                    )
                : nav.onClick,
            activated: nav.activated,
          })),
        });
        return;
      }
      // option
      barData.push({
        title: entry.title,
        tracker: entry.id,
        options: entry.options.map((opt) => ({
          title: opt.title,
          icon: opt.icon,
          svgIcon: opt.svgIcon,
          onClick:
            'onClick' in opt ? opt.onClick : () => this.forward(entry.id, opt),
          activated: false,
          forward: 'options' in opt,
          switchState: opt['switchState'],
        })),
      });
    });
  }

  private appendRailEntry(barData: Section[]) {
    if (this.canGoBack() && this.showBack()) {
      barData.push({
        tracker: BACK_TRACKER,
        options: [
          {
            title: i18n().back,
            icon: 'arrow_back',
            svgIcon: '',
            onClick: () => {
              this.location.subscribe((e) => {
                console.log(e);
              });
              this.location.back();
              return true;
            },
            activated: false,
            forward: false,
          },
        ],
      });
    }
    const navigations = this.navigation()?.sections.reduce(
      (acc, e) => {
        if (e.kind !== 'navigation') {
          return acc;
        }
        acc.push(
          ...e.entries.map(
            (entry) => [e.id, entry] as [string, M3NavigationEntry],
          ),
        );
        return acc;
      },
      [] as [string, M3NavigationEntry][],
    );
    if (!navigations) return;
    const maxElements = 7;
    const navs = navigations.slice(0, maxElements);
    const index = navigations.findIndex((e) => e[1].activated);
    if (index > maxElements - 1) {
      navs[maxElements - 1] = navigations[index];
    }
    barData.push({
      tracker: RAIL_TRACKER,
      options: navs.map(([parentId, nav]) => ({
        title: nav.title,
        icon: nav.icon,
        svgIcon: nav.svgIcon,
        activated: nav.activated,
        onClick:
          nav.activated && 'options' in nav
            ? () =>
                this.forward(parentId, nav as M3NavigationNestedOptionSection)
            : nav.onClick,
        forward: nav.activated && 'options' in nav,
      })),
    });
  }

  private appendStackEntry(
    barData: Section[],
    stack: M3NavigationNestedOptionSection['id'][],
    previous: boolean,
  ) {
    const index = previous ? stack.length - 2 : stack.length - 1;
    const trackId = this.makeId(index + 1);
    const data = getById(
      this.navigation(),
      trackId,
    ) as M3NavigationNestedOptionSection;
    const options: RailDrawerEntry[] = data.options.map((opt) => ({
      title: opt.title,
      icon: opt.icon,
      svgIcon: opt.svgIcon,
      onClick: 'onClick' in opt ? opt.onClick : () => this.forward('', opt),
      activated: false,
      forward: 'options' in opt,
      switchState: opt['switchState'],
    }));
    options.unshift({
      title:
        index < 1
          ? i18n().mainMenu
          : getById(this.navigation(), this.makeId(index)).title,
      icon: 'arrow_back',
      svgIcon: '',
      onClick: () => this.backward(),
      activated: true,
      forward: false,
    });
    barData.push({
      tracker: trackId,
      options,
    });
  }

  private makeId(len: number) {
    return this.stack()
      .slice(0, len)
      .reduce((acc, e) => (acc ? acc + '.' + e : e), '');
  }

  private canGoBack() {
    return !this.router.url.startsWith('/home');
  }
}
