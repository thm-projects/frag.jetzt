import { Component, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  SelectInputAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-select-input',
  templateUrl: './multi-level-select-input.component.html',
  styleUrls: ['./multi-level-select-input.component.scss'],
})
export class MultiLevelSelectInputComponent {
  data = inject(DYNAMIC_INPUT) as BuiltAction<SelectInputAction>;
}
