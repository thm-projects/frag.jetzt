import { Component, HostBinding, Input } from '@angular/core';
import { M3PanePriority, M3PaneType } from '../m3-layout-types';

@Component({
  selector: 'm3-supporting-pane',
  standalone: true,
  imports: [],
  templateUrl: './m3-supporting-pane.component.html',
  styleUrl: './m3-supporting-pane.component.scss',
})
export class M3SupportingPaneComponent {
  @Input('type') _type: M3PaneType = 'flexible';
  @Input('priority') _priority: M3PanePriority = 'primary';
  @HostBinding('class') get __priority() {
    return `m3-comp-supporting-pane priority-${this._priority} type-${this._type}`;
  }
}
