import { TemplateRef } from '@angular/core';

export interface M3NavigationTemplate {
  template: TemplateRef<any>;
}

export enum M3NavigationKind {
  Drawer = 'drawer',
  Rail = 'rail',
}
