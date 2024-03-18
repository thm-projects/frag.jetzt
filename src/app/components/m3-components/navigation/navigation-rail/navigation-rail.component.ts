import {
  Component,
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
  // es-lint @angular-eslint/component-selector
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

  @ViewChild('viewContainerRef', { read: ViewContainerRef })
  set viewContainerRef(vcr: ViewContainerRef) {
    this._vcr = vcr;
  }

  @Input() set outlet(portal: string) {
    this._outlet = this.m3NavigationService.registerPortal(portal);
    const listener = this._outlet.listener;
    listener.subscribe((config) => {
      this._fab = config.fab;
      for (const label of config.label) {
        const labelComponentRef = this._vcr.createComponent(
          NavigationLabelComponent,
          {
            injector: Injector.create({
              providers: [{ provide: MAT_DIALOG_DATA, useValue: label }],
            }),
          },
        );
        this._vcr.insert(labelComponentRef.hostView);
      }
    });
  }

  constructor(private readonly m3NavigationService: M3NavigationService) {}

  ngOnDestroy() {
    this._outlet?.destroy();
  }
}
