import { Component, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  SwitchAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-switch',
  templateUrl: './multi-level-switch.component.html',
  styleUrls: [
    './multi-level-switch.component.scss',
    '../common-form-field.scss',
  ],
})
export class MultiLevelSwitchComponent {
  data = inject(DYNAMIC_INPUT) as BuiltAction<SwitchAction>;
}
