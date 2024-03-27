import { Component, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  RadioSelectAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-radio-select',
  templateUrl: './multi-level-radio-select.component.html',
  styleUrls: [
    './multi-level-radio-select.component.scss',
    '../common-form-field.scss',
  ],
})
export class MultiLevelRadioSelectComponent {
  data = inject(DYNAMIC_INPUT) as BuiltAction<RadioSelectAction>;
}
