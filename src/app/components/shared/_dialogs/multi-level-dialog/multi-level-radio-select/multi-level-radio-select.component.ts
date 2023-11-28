import { Component, OnInit, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  RadioSelectAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-radio-select',
  templateUrl: './multi-level-radio-select.component.html',
  styleUrls: ['./multi-level-radio-select.component.scss'],
})
export class MultiLevelRadioSelectComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as BuiltAction<RadioSelectAction>;

  constructor() {}

  ngOnInit(): void {}
}
