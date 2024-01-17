import { Component, OnInit, inject } from '@angular/core';
import { BuiltAction, DYNAMIC_INPUT, QuotaInputAction } from '../interface/multi-level-dialog.types';

interface Option {
  value: string;
  i18nPath: string;
}

@Component({
  selector: 'app-multi-level-date-input',
  templateUrl: './multi-level-date-input.component.html',
  styleUrls: ['./multi-level-date-input.component.scss'],
})


export class MultiLevelDateInputComponent implements OnInit {
  data = inject(DYNAMIC_INPUT) as BuiltAction<QuotaInputAction>;

  options: Option[] = [
    { value: 'reset', i18nPath: 'Zurücksetzen' },
    { value: 'hourly', i18nPath: 'Stündlich' },
    { value: 'daily', i18nPath: 'Täglich' },
    { value: 'weekly', i18nPath: 'Wöchentlich' },
    { value: 'monthly', i18nPath: 'Monatlich' },
    { value: 'yearly', i18nPath: 'Jährlich' },
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
