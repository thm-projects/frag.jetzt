import { Injectable } from '@angular/core';
import {
  NavigationPortal,
  NavigationConfig,
} from './navigation-rail/navigation-rail.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class M3NavigationService {
  private readonly portals: Map<string, NavigationPortal> = new Map();
  private readonly newPortalListener: Observable<NavigationPortal> =
    new Observable<NavigationPortal>();

  constructor() {}

  registerPortal(identifier: string): NavigationPortal {
    if (this.portals.has(identifier)) {
      console.warn('portal already in use');
      return this.portals.get(identifier)!;
    } else {
      const portal: NavigationPortal = {
        listener: new BehaviorSubject({
          active: true,
          label: [],
        }),
        identifier: identifier,
        destroy: () => {
          this.portals.delete(identifier);
        },
      };
      this.portals.set(identifier, portal);
      return portal;
    }
  }

  emit(name: string, config: NavigationConfig) {
    if (!this.portals.has(name)) {
      this.newPortalListener
        .pipe(filter((x) => x.identifier === name))
        .pipe(take(1))
        .subscribe((x) => {
          x.listener.next(config);
        });
    } else {
      this.portals.get(name)!.listener.next(config);
    }
  }
}
