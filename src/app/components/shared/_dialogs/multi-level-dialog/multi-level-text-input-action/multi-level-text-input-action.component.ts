import { Component, OnInit, inject } from '@angular/core';
import {
  ActionTextInput,
  DYNAMIC_INPUT,
  MultiLevelActionInterface,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-text-input-action',
  templateUrl: './multi-level-text-input-action.component.html',
  styleUrls: ['./multi-level-text-input-action.component.scss'],
})
export class MultiLevelTextInputActionComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as MultiLevelActionInterface<ActionTextInput>;

  constructor() {}

  ngOnInit(): void {}

  submit() {
    const control = this.data.entry.action.control;
    this.data.submit(control?.value);
  }
}
