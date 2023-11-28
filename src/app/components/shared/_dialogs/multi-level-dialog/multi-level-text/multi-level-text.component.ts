import { Component, OnInit, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  TextAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-text',
  templateUrl: './multi-level-text.component.html',
  styleUrls: ['./multi-level-text.component.scss'],
})
export class MultiLevelTextComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as BuiltAction<TextAction>;

  constructor() {}

  ngOnInit(): void {}
}
