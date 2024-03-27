import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  M3NavigationKind,
  M3NavigationTemplate,
} from '../../components/navigation/m3-nav-types';

@Injectable({
  providedIn: 'root',
})
export class M3NavigationService {
  private readonly templateListener: {
    [A in M3NavigationKind]: BehaviorSubject<M3NavigationTemplate | undefined>;
  } = {
    [M3NavigationKind.Drawer]: new BehaviorSubject(undefined),
    [M3NavigationKind.Rail]: new BehaviorSubject(undefined),
  };

  constructor() {}

  on(kind: M3NavigationKind): Observable<M3NavigationTemplate | undefined> {
    return this.templateListener[kind];
  }

  destroy(kind: M3NavigationKind) {
    this.templateListener[kind].next({ template: undefined });
  }

  build(kind: M3NavigationKind, template: TemplateRef<any>) {
    this.templateListener[kind].next({
      template: template,
    });
  }
}
