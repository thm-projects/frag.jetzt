import { Component, computed, viewChild } from '@angular/core';
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
import { M3LabelComponent } from '../m3-label/m3-label.component';
import { M3NavigationEntry } from '../m3-navigation.types';

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
    MatTabsModule,
    M3LabelComponent,
  ],
  templateUrl: './m3-navigation.component.html',
  styleUrl: './m3-navigation.component.scss',
})
export class M3NavigationComponent {
  protected header = HEADER.asReadonly();
  protected navigation = NAVIGATION.asReadonly();
  protected fab = FAB_BUTTON.asReadonly();
  protected isSmall = computed(() => windowWatcher.windowState() === 'compact');
  protected isExpanded = computed(
    () => windowWatcher.windowState() === 'expanded',
  );
  protected drawerRail = viewChild(M3NavDrawerRailComponent);
  protected bottomData = computed(() => {
    return this.navigation()?.sections.reduce((acc, section) => {
      acc.push(...section.entries);
      return acc;
    }, [] as M3NavigationEntry[]);
  });
  protected hideBottomBar = computed(() => {
    const nav = this.bottomData();
    return !nav || nav.length < 2 || !this.isSmall();
  });
  protected readonly moreElem: M3NavigationEntry = {
    title: 'More',
    icon: 'menu',
    onClick: () => {
      this.drawerRail().open();
      return false;
    },
    activated: false,
  };
  protected bottomBarData = computed(() => {
    if (this.hideBottomBar()) {
      return [];
    }
    const navigations = this.bottomData();
    const maxElements = 5;
    const hasMany = navigations.length > maxElements;
    const currentMax = hasMany ? maxElements - 1 : maxElements;
    const navs = navigations.slice(0, currentMax);
    const index = navigations.findIndex((e) => e.activated);
    if (index >= currentMax) {
      navs[currentMax - 1] = navigations[index];
    }
    if (hasMany) {
      navs.push(this.moreElem);
    }
    return navs;
  });
}
