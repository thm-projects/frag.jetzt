import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { TooltipPosition } from '@angular/material/tooltip';
import {
  BuiltAction,
  DYNAMIC_INPUT,
  RadioSelectAction,
} from '../interface/multi-level-dialog.types';

@Component({
  selector: 'app-multi-level-radio-select',
  templateUrl: './multi-level-radio-select.component.html',
  styleUrls: [
    './multi-level-radio-select.component.scss',
    '../common-form-field.scss',
  ],
  standalone: false,
})
export class MultiLevelRadioSelectComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as BuiltAction<RadioSelectAction>;
  tooltipPosition: TooltipPosition = 'right';

  constructor(private breakpointObserver: BreakpointObserver) {}

  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .subscribe((state: BreakpointState) => {
        this.tooltipPosition = state.matches ? 'below' : 'right';
      });
  }
  onIconClick(event: MouseEvent): void {
    event.preventDefault();
  }
}
