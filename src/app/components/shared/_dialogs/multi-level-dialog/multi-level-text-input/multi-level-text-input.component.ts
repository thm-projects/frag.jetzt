import { Component, OnInit, inject } from '@angular/core';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  TextInputAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-text-input',
  templateUrl: './multi-level-text-input.component.html',
  styleUrls: ['./multi-level-text-input.component.scss'],
})
export class MultiLevelTextInputComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as BuiltAction<TextInputAction>;

  constructor() {}

  ngOnInit(): void {}
}
