import { Component, OnInit, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  SelectInputAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-select-input',
  templateUrl: './multi-level-select-input.component.html',
  styleUrls: [
    './multi-level-select-input.component.scss',
    '../common-form-field.scss',
  ],
})
export class MultiLevelSelectInputComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as BuiltAction<SelectInputAction>;

  constructor() {}

  ngOnInit(): void {
    this.data.control.setValue(this.data.defaultValue);
  }
}
