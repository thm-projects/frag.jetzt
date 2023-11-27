import { Component, OnInit, inject } from '@angular/core';
import {
  ActionSelect,
  DYNAMIC_INPUT,
  MultiLevelActionInterface,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-select-action',
  templateUrl: './multi-level-select-action.component.html',
  styleUrls: ['./multi-level-select-action.component.scss'],
})
export class MultiLevelSelectActionComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as MultiLevelActionInterface<ActionSelect>;

  constructor() {}

  ngOnInit(): void {}
}
