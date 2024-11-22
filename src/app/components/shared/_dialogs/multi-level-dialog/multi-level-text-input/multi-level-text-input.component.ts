import { Component, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  TextInputAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-text-input',
  templateUrl: './multi-level-text-input.component.html',
  styleUrls: [
    './multi-level-text-input.component.scss',
    '../common-form-field.scss',
  ],
  standalone: false,
})
export class MultiLevelTextInputComponent {
  data = inject(DYNAMIC_INPUT) as BuiltAction<TextInputAction>;
  hidden = Boolean(this.data.hidden);
  readonly initialHidden = this.hidden;
}
