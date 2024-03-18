import {
  Component,
  ComponentRef,
  HostBinding,
  Injector,
  Input,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { NgComponentOutlet, NgForOf, NgIf } from '@angular/common';
import { M3NavigationService } from '../m3-navigation.service';
import { BehaviorSubject } from 'rxjs';
import { NavigationLabelComponent } from '../navigation-label/navigation-label.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

export interface NavigationPortal {
  identifier: string;
  listener: BehaviorSubject<NavigationConfig>;

  destroy(): void;
}

export type NavigationLabelState = 'active' | 'enabled' | 'disabled';

export interface NavigationFabConfig {
  name: string;
  icon: string;

  click?($event: MouseEvent): void;
}

export interface NavigationConfig {
  active: boolean;
  fab?: NavigationFabConfig;
  label: NavigationLabel[];
}

export interface NavigationLabel {
  name: string;
  icon?: string;
  state: NavigationLabelState;

  click?($event: MouseEvent): void;
}

@Component({
  selector: 'app-navigation-rail',
  standalone: true,
  imports: [NgIf, NgForOf, NgComponentOutlet, MatIcon, MatFabButton],
  templateUrl: './navigation-rail.component.html',
  styleUrl: './navigation-rail.component.scss',
})
export class NavigationRailComponent implements OnDestroy {
  protected _outlet: NavigationPortal;
  protected _vcr: ViewContainerRef;
  protected _fab: NavigationFabConfig | undefined;
  protected _active: boolean = true;

  @HostBinding('class') get _state() {
    return this._active ? 'active' : 'inactive';
  }

  @ViewChild('viewContainerRef', { read: ViewContainerRef })
  set viewContainerRef(vcr: ViewContainerRef) {
    this._vcr = vcr;
  }

  @Input() set outlet(portal: string) {
    this._outlet = this.m3NavigationService.registerPortal(portal);
    const listener = this._outlet.listener;
    const lookupMap: Map<
      string,
      [ComponentRef<NavigationLabelComponent>, number]
    > = new Map();
    listener.subscribe((config) => {
      this._active = config.active;
      this._fab = config.fab;
      for (let i = 0; i < config.label.length; i++) {
        const label = config.label[i];
        if (lookupMap.has(label.name)) {
          const [component, index] = lookupMap.get(label.name)!;
          if (i !== index) {
            this._vcr.move(component.hostView, i);
          }
          component.instance.patch(label);
        } else {
          const labelComponentRef = this._vcr.createComponent(
            NavigationLabelComponent,
            {
              injector: Injector.create({
                providers: [{ provide: MAT_DIALOG_DATA, useValue: label }],
              }),
            },
          );
          this._vcr.insert(labelComponentRef.hostView, i);
        }
      }
      const newLookup: Set<string> = new Set(config.label.map((x) => x.name));
      for (const [key, [component]] of lookupMap) {
        if (!newLookup.has(key)) {
          component.destroy();
        }
      }
    });
  }

  constructor(private readonly m3NavigationService: M3NavigationService) {}

  get isActive() {
    return this._active;
  }

  ngOnDestroy() {
    this._outlet?.destroy();
  }
}
