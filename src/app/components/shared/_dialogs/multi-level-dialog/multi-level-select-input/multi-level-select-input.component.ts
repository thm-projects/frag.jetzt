import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { BuiltAction, DYNAMIC_INPUT, SelectInputAction } from '../interface/multi-level-dialog.types';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-multi-level-select-input',
  templateUrl: './multi-level-select-input.component.html',
  styleUrls: ['./multi-level-select-input.component.scss']
})
export class MultiLevelSelectInputComponent {
  data = inject(DYNAMIC_INPUT) as BuiltAction<SelectInputAction>;
  
  constructor() {
    this.data.control = new FormControl(this.data.defaultValue);
  }
}
