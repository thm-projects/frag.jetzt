import { Component, OnInit, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  QuotaInputAction,
  TextInputAction,
} from '../interface/multi-level-dialog.types';

import { NgxMatDatetimePickerModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';

@Component({
  selector: 'app-multi-level-quota-input',
  templateUrl: './multi-level-quota-input.component.html',
  styleUrls: ['./multi-level-quota-input.component.scss'],
})

export class MultiLevelQuotaInputComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as BuiltAction<QuotaInputAction>;
  hidden = Boolean(this.data.hidden);
  readonly initialHidden = this.hidden;

  constructor() {}

  ngOnInit(): void {}

  clampValue(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
