import { Component, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  QuotaInputAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-quota-input',
  templateUrl: './multi-level-quota-input.component.html',
  styleUrls: ['./multi-level-quota-input.component.scss'],
  standalone: false,
})
export class MultiLevelQuotaInputComponent {
  data = inject(DYNAMIC_INPUT) as BuiltAction<QuotaInputAction>;
  hidden = Boolean(this.data.hidden);
  readonly initialHidden = this.hidden;

  clampValue(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
