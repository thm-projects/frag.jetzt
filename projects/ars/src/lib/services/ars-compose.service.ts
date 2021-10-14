import {
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
  InjectionToken,
  Injector,
  Type,
  ViewContainerRef
} from '@angular/core';
import { PortalInjector } from '@angular/cdk/portal';
import { ArsComposeHostDirective } from '../compose/ars-compose-host.directive';
import { ARS_MAT_MENU_ITEM_DATA, ArsMatMenuItemConfig } from '../compose/elements/mat-menu-item/ars-mat-menu-item-config';
import { ARS_MAT_CHIP_LIST_CONFIG, ArsMatChipListConfig } from '../compose/elements/mat-chip-list/mat-chip-list-config';
import { ARS_MAT_DATE_PICKER, ArsMatDatePickerConfig } from '../compose/elements/mat-date-picker/mat-date-picker-config';
import { ARS_MAT_TOGGLE_CONFIG, ArsMatToggleConfig } from '../compose/elements/mat-toggle/ars-mat-toggle-config';
import { ARS_MAT_BUTTON_CONFIG, ArsMatButtonConfig } from '../compose/elements/mat-button/ars-mat-button-config';
import { MatButtonComponent } from '../compose/elements/mat-button/mat-button.component';
import { MatChipListComponent } from '../compose/elements/mat-chip-list/mat-chip-list.component';
import { MatDatePickerComponent } from '../compose/elements/mat-date-picker/mat-date-picker.component';
import { MatToggleComponent } from '../compose/elements/mat-toggle/mat-toggle.component';
import { MatMenuItemComponent } from '../compose/elements/mat-menu-item/mat-menu-item.component';
import { ArsAnchor, ArsObserver } from '../models/util/ars-observer';

export interface ArsComposeBuilder{
  menuItem(i: ArsMatMenuItemConfig): void;

  chipList(i: ArsMatChipListConfig): void;

  datePicker(i: ArsMatDatePickerConfig): void;

  toggle(i: ArsMatToggleConfig): void;

  button(i: ArsMatButtonConfig): void;

  altToggle(onFalse: ArsMatMenuItemConfig, onTrue: ArsMatMenuItemConfig, obs: ArsObserver<boolean>,
            condition: () => boolean): ArsObserver<boolean>;
}

@Injectable({
  providedIn:'root'
})
export class ArsComposeService{

  constructor(
    private cfr: ComponentFactoryResolver,
    private injector: Injector
  ){
  }

  builder(host: ArsComposeHostDirective, e: (e: ArsComposeBuilder) => void): ComponentRef<any>[]{
    let list: ComponentRef<any>[] = [];
    const _this = this;
    e({
      button(i: ArsMatButtonConfig){
        const ref = _this.build(host, MatButtonComponent, ARS_MAT_BUTTON_CONFIG, i);
        list.push(ref);
      },
      chipList(i: ArsMatChipListConfig){
        const ref = _this.build(host, MatChipListComponent, ARS_MAT_CHIP_LIST_CONFIG, i);
        list.push(ref);
      },
      datePicker(i: ArsMatDatePickerConfig){
        const ref = _this.build(host, MatDatePickerComponent, ARS_MAT_DATE_PICKER, i);
        list.push(ref);
      },
      menuItem(i: ArsMatMenuItemConfig){
        const ref = _this.build(host, MatMenuItemComponent, ARS_MAT_MENU_ITEM_DATA, i);
        list.push(ref);
      },
      toggle(i: ArsMatToggleConfig){
        const ref = _this.build(host, MatToggleComponent, ARS_MAT_TOGGLE_CONFIG, i);
        list.push(ref);
      },
      altToggle(onFalse: ArsMatMenuItemConfig, onTrue: ArsMatMenuItemConfig,
                obs: ArsObserver<boolean>, condition: () => boolean): ArsObserver<boolean>{
        onFalse.condition = () => !obs.get() && condition();
        onFalse.callback = () => obs.set(true);
        onTrue.condition = () => obs.get() && condition();
        onTrue.callback = () => obs.set(false);
        this.menuItem(onFalse);
        this.menuItem(onTrue);
        return obs;
      }
    });
    return list;
  }

  build<E>(host: ArsComposeHostDirective, component: Type<E>, token: InjectionToken<any>, data: any): ComponentRef<E>{
    return this.create(
      host.viewContainerRef,
      component,
      this.createMap(token, data)
    );
  }

  create<E>(vcr: ViewContainerRef, component: Type<E>, map: WeakMap<any, any>): ComponentRef<E>{
    return vcr.createComponent(this.resolve(component), null, this.createInjector(map));
  }

  private resolve<E>(component: Type<E>): ComponentFactory<E>{
    return this.cfr.resolveComponentFactory(component);
  }

  private createInjector(map: WeakMap<any, any>): PortalInjector{
    return new PortalInjector(this.injector, map);
  }

  public createMap(key: any, value: any){
    const map = new WeakMap<any, any>();
    map.set(key, value);
    return map;
  }

}
