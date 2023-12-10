import { Component, OnInit, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  SwitchAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-switch',
  templateUrl: './multi-level-switch.component.html',
  styleUrls: ['./multi-level-switch.component.scss'],
})
export class MultiLevelSwitchComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as BuiltAction<SwitchAction>;

  constructor() {}

  ngOnInit(): void {}
}
