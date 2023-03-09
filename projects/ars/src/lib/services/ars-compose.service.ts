import {
  ComponentRef,
  Injectable,
  InjectionToken,
  Injector,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { ArsComposeHostDirective } from '../compose/ars-compose-host.directive';
import {
  ARS_MAT_SUB_MENU_DATA,
  ArsMatSubMenuConfig,
} from '../compose/elements/mat-sub-menu/ars-mat-sub-menu-config';
import {
  ARS_MAT_MENU_ITEM_DATA,
  ArsMatMenuItemConfig,
} from '../compose/elements/mat-menu-item/ars-mat-menu-item-config';
import {
  ARS_MAT_CHIP_LIST_CONFIG,
  ArsMatChipListConfig,
} from '../compose/elements/mat-chip-list/mat-chip-list-config';
import {
  ARS_MAT_DATE_PICKER,
  ArsMatDatePickerConfig,
} from '../compose/elements/mat-date-picker/mat-date-picker-config';
import {
  ARS_MAT_TOGGLE_CONFIG,
  ArsMatToggleConfig,
} from '../compose/elements/mat-toggle/ars-mat-toggle-config';
import {
  ARS_MAT_BUTTON_CONFIG,
  ArsMatButtonConfig,
} from '../compose/elements/mat-button/ars-mat-button-config';
import { MatButtonComponent } from '../compose/elements/mat-button/mat-button.component';
import { MatChipListComponent } from '../compose/elements/mat-chip-list/mat-chip-list.component';
import { MatDatePickerComponent } from '../compose/elements/mat-date-picker/mat-date-picker.component';
import { MatToggleComponent } from '../compose/elements/mat-toggle/mat-toggle.component';
import { MatMenuItemComponent } from '../compose/elements/mat-menu-item/mat-menu-item.component';
import { ArsObserver } from '../models/util/ars-observer';
import { MatSubMenuComponent } from '../compose/elements/mat-sub-menu/mat-sub-menu.component';

export interface ArsComposeBuilder {
  menuItem(i: ArsMatMenuItemConfig): void;

  subMenu(i: ArsMatSubMenuConfig): void;

  chipList(i: ArsMatChipListConfig): void;

  datePicker(i: ArsMatDatePickerConfig): void;

  toggle(i: ArsMatToggleConfig): void;

  button(i: ArsMatButtonConfig): void;

  altToggle(
    onFalse: ArsMatMenuItemConfig,
    onTrue: ArsMatMenuItemConfig,
    obs: ArsObserver<boolean>,
    condition: () => boolean,
  ): ArsObserver<boolean>;
}

@Injectable({
  providedIn: 'root',
})
export class ArsComposeService {
  constructor(private injector: Injector) {}

  builder(
    host: ArsComposeHostDirective,
    e: (e: ArsComposeBuilder) => void,
  ): ComponentRef<any>[] {
    let list: ComponentRef<any>[] = [];
    const _this = this;
    e({
      button(i: ArsMatButtonConfig) {
        const ref = _this.build(
          host,
          MatButtonComponent,
          ARS_MAT_BUTTON_CONFIG,
          i,
        );
        list.push(ref);
      },
      chipList(i: ArsMatChipListConfig) {
        const ref = _this.build(
          host,
          MatChipListComponent,
          ARS_MAT_CHIP_LIST_CONFIG,
          i,
        );
        list.push(ref);
      },
      datePicker(i: ArsMatDatePickerConfig) {
        const ref = _this.build(
          host,
          MatDatePickerComponent,
          ARS_MAT_DATE_PICKER,
          i,
        );
        list.push(ref);
      },
      menuItem(i: ArsMatMenuItemConfig) {
        const ref = _this.build(
          host,
          MatMenuItemComponent,
          ARS_MAT_MENU_ITEM_DATA,
          i,
        );
        list.push(ref);
      },
      subMenu(i: ArsMatSubMenuConfig) {
        const ref = _this.build(
          host,
          MatSubMenuComponent,
          ARS_MAT_SUB_MENU_DATA,
          i,
        );
        list.push(ref);
      },
      toggle(i: ArsMatToggleConfig) {
        const ref = _this.build(
          host,
          MatToggleComponent,
          ARS_MAT_TOGGLE_CONFIG,
          i,
        );
        list.push(ref);
      },
      altToggle(
        onFalse: ArsMatMenuItemConfig,
        onTrue: ArsMatMenuItemConfig,
        obs: ArsObserver<boolean>,
        condition: () => boolean,
      ): ArsObserver<boolean> {
        onFalse.condition = () => !obs.get() && condition();
        onFalse.callback = () => obs.set(true);
        onTrue.condition = () => obs.get() && condition();
        onTrue.callback = () => obs.set(false);
        this.menuItem(onFalse);
        this.menuItem(onTrue);
        return obs;
      },
    });
    return list;
  }

  build<E>(
    host: ArsComposeHostDirective,
    component: Type<E>,
    token: InjectionToken<any>,
    data: any,
  ): ComponentRef<E> {
    return this.create(
      host.viewContainerRef,
      component,
      this.createInjector(token, data),
    );
  }

  create<E>(
    vcr: ViewContainerRef,
    component: Type<E>,
    injector: Injector,
  ): ComponentRef<E> {
    return vcr.createComponent(component, { injector });
  }

  private createInjector(token: InjectionToken<any>, data: any): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [{ provide: token, useValue: data }],
    });
  }
}
