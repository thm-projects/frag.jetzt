import { Component, Input, numberAttribute } from '@angular/core';
import {
  M3PanePriority,
  m3PanePriorityAttribute,
  M3PaneType,
  m3PaneTypeAttribute,
} from '../m3-layout-types';

@Component({
  selector: 'm3-supporting-pane',
  host: {
    '[class]': `'m3-supporting-pane ' + 'type-' + type + ' priority-' + priority + ' elevation-' + elevation`,
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

  get type(): M3PaneType {
    return this._type;
  }

  private _type: M3PaneType;

  @Input({ transform: m3PanePriorityAttribute })
  set priority(value: M3PanePriority) {
    this._priority = value;
  }

  get priority(): M3PanePriority {
    return this._priority;
  }

  private _priority: M3PanePriority;

  @Input({ transform: numberAttribute })
  set elevation(value: 0 | 1) {
    this._elevation = value;
  }

  get elevation(): 0 | 1 {
    return this._elevation;
  }

  private _elevation: 0 | 1 = 1;
}
