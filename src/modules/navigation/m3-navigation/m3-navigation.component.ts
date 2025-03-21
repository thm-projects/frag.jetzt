import {
  Component,
  Signal,
  computed,
  viewChild,
  OnInit,
  OnDestroy,
  Type,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { M3NavDrawerRailComponent } from '../m3-nav-drawer-rail/m3-nav-drawer-rail.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { windowWatcher } from '../utils/window-watcher';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { FAB_BUTTON, HEADER, NAVIGATION } from '../m3-navigation-emitter';
import { CompactNavigationButtonComponent } from '../compact-navigation-button/compact-navigation-button.component';
import { OnlineStateService } from 'app/services/state/online-state.service';
import {
  M3NavigationEntry,
  M3NavigationNestedOptionSection,
} from '../m3-navigation.types';
import { I18nLoader } from 'app/base/i18n/i18n-loader';

import rawI18n from './i18n.json';
import { MatBadgeModule } from '@angular/material/badge';
const i18n = I18nLoader.loadModule(rawI18n);

@Component({
  selector: 'm3-navigation',
  imports: [
    M3NavDrawerRailComponent,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    CommonModule,
    MatTabsModule,
    MatBadgeModule,
    CompactNavigationButtonComponent,
  ],
  templateUrl: './m3-navigation.component.html',
  styleUrl: './m3-navigation.component.scss',
})
export class M3NavigationComponent implements OnInit, OnDestroy {
  protected readonly i18n = i18n;
  protected header = HEADER.asReadonly();
  protected headerSlogan = computed(() => {
    const slogan = this.header()?.slogan;
    return (typeof slogan === 'string' ? null : slogan) as Type<any>;
  });
  protected navigation = NAVIGATION.asReadonly();
  protected fab = FAB_BUTTON.asReadonly();
  protected isSmall = computed(() => windowWatcher.windowState() === 'compact');
  protected isExpanded = computed(() => {
    const state = windowWatcher.windowState();
    return state !== 'compact' && state !== 'medium';
  });
  protected drawerRail = viewChild(M3NavDrawerRailComponent);
  protected bottomData = computed(() => {
    return this.navigation()?.sections.reduce(
      (acc, section) => {
        if (section.kind !== 'navigation') {
          return acc;
        }
        acc.push(
          ...section.entries.map(
            (entry) => [section.id, entry] as [string, M3NavigationEntry],
          ),
        );
        return acc;
      },
      [] as [string, M3NavigationEntry][],
    );
  });
  protected hideBottomBar = computed(() => {
    const nav = this.bottomData();
    return !nav || nav.length < 2 || !this.isSmall();
  });
  protected readonly moreElem: Signal<M3NavigationEntry> = computed(() => ({
    id: 'more',
    title: i18n().more,
    icon: 'menu',
    onClick: () => {
      this.drawerRail().open();
      return false;
    },
    activated: false,
  }));
  protected bottomBarData = computed(() => {
    if (this.hideBottomBar()) {
      return [];
    }
    const navigations = this.bottomData();
    const maxElements = 5;
    const hasMany = navigations.length > maxElements;
    const currentMax = hasMany ? maxElements - 1 : maxElements;
    const navs = navigations.slice(0, currentMax);
    const index = navigations.findIndex((e) => e[1].activated);
    if (index >= currentMax) {
      navs[currentMax - 1] = navigations[index];
    }
    if (hasMany) {
      navs.push(['', this.moreElem()]);
    }
    return navs;
  });
  protected isOnline: boolean;
  private onlineSubscription: Subscription;

  constructor(private onlineStateService: OnlineStateService) {}

  ngOnInit(): void {
    this.onlineSubscription = this.onlineStateService.online$.subscribe(
      (online) => {
        this.isOnline = online;
      },
    );
  }

  ngOnDestroy(): void {
    this.onlineSubscription?.unsubscribe();
  }

  onNavigate() {
    this.drawerRail().close();
  }

  protected forward(id: string, e: M3NavigationEntry) {
    if (e.activated && e.options?.length) {
      this.drawerRail().forward(id, e as M3NavigationNestedOptionSection);
    }
    e.onClick();
  }
}
