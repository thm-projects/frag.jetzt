import { Component, OnInit, inject } from '@angular/core';
import { DYNAMIC_INPUT } from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-select-action',
  templateUrl: './multi-level-select-action.component.html',
  styleUrls: ['./multi-level-select-action.component.scss'],
})
export class MultiLevelSelectActionComponent implements OnInit {
  data = inject(DYNAMIC_INPUT);

  constructor() {}

  ngOnInit(): void {}
}
