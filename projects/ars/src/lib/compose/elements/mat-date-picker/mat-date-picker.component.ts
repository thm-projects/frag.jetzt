import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { ARS_MAT_DATE_PICKER, ArsMatDatePickerConfig } from './mat-date-picker-config';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

@Component({
    selector: 'ars-mat-date-picker',
    templateUrl: './mat-date-picker.component.html',
    styleUrls: ['./mat-date-picker.component.scss'],
    standalone: false
})
export class MatDatePickerComponent implements OnInit,AfterViewInit{

  constructor(
    @Inject(ARS_MAT_DATE_PICKER) public data: ArsMatDatePickerConfig
  ){
  }

  ngOnInit(): void{
  }

  ngAfterViewInit(){
  }

  dateChange(e: MatDatepickerInputEvent<any>){
    this.data.change.set(new Date(e.value));
  }

}
