import {
  Component,
  Injector,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { M3NavDrawerRailComponent } from '../m3-nav-drawer-rail/m3-nav-drawer-rail.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  M3NavigationOption,
  M3NavigationTemplate,
} from '../m3-navigation.types';
import { windowWatcher } from '../utils/window-watcher';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { M3LabelButton } from 'modules/m3/components/buttons/label-button';
import { M3Icon, M3Label } from 'modules/m3/components/buttons/base';
import { MatTabsModule } from '@angular/material/tabs';
import { NAVIGATION } from '../m3-navigation-emitter';

export type InternalTemplate = Omit<
  M3NavigationTemplate,
  'divideOptions' | 'preferedNavigation'
> & {
  divideOptions: boolean;
  preferedNavigation:
    | M3NavigationOption
    | {
        type: 'bar';
      };
};

@Component({
  selector: 'm3-navigation',
  standalone: true,
  imports: [
    M3NavDrawerRailComponent,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    CommonModule,
    M3LabelButton,
    M3Label,
    M3Icon,
    MatTabsModule,
  ],
  templateUrl: './m3-navigation.component.html',
  styleUrl: './m3-navigation.component.scss',
})
export class M3NavigationComponent {
  protected drawerRail = viewChild(M3NavDrawerRailComponent);
  protected data = computed(() => {
    const isSmall = windowWatcher.windowState() === 'compact';
    const internal: InternalTemplate = {
      divideOptions: true,
      preferedNavigation: {
        type: 'rail',
        railDivider: false,
        railOrientation: 'center',
      },
      navigations: [],
      options: [],
      elevation: 0,
      header: { options: [], title: '' },
      ...NAVIGATION(),
    };
    if (internal.navigations.length < 3) {
      internal.preferedNavigation = {
        type: 'tabs',
        maxTabs: internal.preferedNavigation['maxTabs'] || null,
      };
    } else if (isSmall) {
      internal.preferedNavigation = {
        type: 'bar',
      };
    }
    return internal;
  });
  protected hideBottomBar = computed(() => {
    const data = this.data();
    return (
      data.navigations.length < 2 ||
      data.preferedNavigation.type === 'tabs' ||
      windowWatcher.windowState() !== 'compact'
    );
  });
  protected bottomBarData = computed(() => {
    const data = this.data();
    const maxElements = 5;
    const hasMany = data.navigations.length > maxElements;
    const currentMax = hasMany ? maxElements - 1 : maxElements;
    const navs = data.navigations.slice(0, currentMax);
    const index = data.navigations.findIndex((e) => e.activated);
    if (index >= currentMax) {
      navs[currentMax - 1] = data.navigations[index];
    }
    if (hasMany) {
      navs.push({
        title: 'More',
        icon: 'menu',
        onClick: () => {
          this.drawerRail().open();
          return false;
        },
        activated: false,
      });
    }
    return navs;
  });
  protected selectedIndex = signal(0);
  private injector = inject(Injector);

  constructor() {
    effect(
      () => {
        const index = this.data().navigations.findIndex((e) => e.activated);
        if (index < 0) {
          this.selectedIndex.set(0);
        } else {
          this.selectedIndex.set(index);
        }
      },
      { injector: this.injector, allowSignalWrites: true },
    );
  }

  protected onClick() {
    this.data().navigations[this.selectedIndex()].onClick();
  }
}
