import { Component, Input } from '@angular/core';
import {
  M3PanePriority,
  m3PanePriorityAttribute,
  M3PaneType,
  m3PaneTypeAttribute,
} from '../m3-layout-types';

@Component({
  selector: 'm3-supporting-pane',
  standalone: true,
  host: {
    '[class]': `'m3-supporting-pane ' + 'type-' + type + ' priority-' + priority`,
  },
  imports: [],
  template: '<ng-content></ng-content>',
  styleUrl: './m3-supporting-pane.component.scss',
})
export class M3SupportingPaneComponent {
  @Input({ transform: m3PaneTypeAttribute })
  set type(type: M3PaneType) {
    this._type = type;
  }

  get type() {
    return this._type;
  }

  private _type: M3PaneType;

  @Input({ transform: m3PanePriorityAttribute })
  set priority(value: M3PanePriority) {
    this._priority = value;
  }

  get priority() {
    return this._priority;
  }

  private _priority: M3PanePriority;
}