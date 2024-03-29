import { Component } from '@angular/core';

@Component({
  selector: `span[m3-icon]`,
  standalone: true,
  template: ` <ng-content></ng-content>`,
  host: {
    class: 'm3-icon material-symbols-outlined',
  },
})
export class M3Icon {}

@Component({
  selector: `span[m3-label]`,
  standalone: true,
  template: ` <ng-content></ng-content>`,
  host: {
    class: 'm3-label',
  },
})
export class M3Label {}

@Component({
  selector: `span[m3-badge]`,
  standalone: true,
  template: ` <ng-content></ng-content>`,
  host: {
    class: 'm3-badge',
  },
})
export class M3Badge {}
