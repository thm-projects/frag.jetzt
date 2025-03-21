import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  ArsMatSubMenuConfig,
  ARS_MAT_SUB_MENU_DATA,
} from './ars-mat-sub-menu-config';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
    selector: 'ars-mat-sub-menu',
    templateUrl: './mat-sub-menu.component.html',
    styleUrls: ['./mat-sub-menu.component.scss'],
    standalone: false
})
export class MatSubMenuComponent implements OnInit {
  @ViewChild(MatMenuTrigger) component: MatMenuTrigger;
  public translate: TranslateService;

  constructor(@Inject(ARS_MAT_SUB_MENU_DATA) public data: ArsMatSubMenuConfig) {
    this.translate = data.translate;
  }

  ngOnInit(): void {}

  public openMenu() {
    this.data.menuOpened?.();
  }

  public action(e: MouseEvent) {
    e.stopImmediatePropagation();
    this.open();
  }

  public open() {
    this.component?.openMenu?.();
  }

  public close() {
    this.component?.closeMenu?.();
  }
}
