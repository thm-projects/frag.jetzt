import { Component, Inject, OnInit } from '@angular/core';
import { ARS_MAT_DATE_PICKER, ArsMatDatePickerConfig } from './mat-date-picker-config';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

@Component({
  selector:'ars-mat-date-picker',
  templateUrl:'./mat-date-picker.component.html',
  styleUrls:['./mat-date-picker.component.scss']
})
export class MatDatePickerComponent implements OnInit{

  constructor(
    @Inject(ARS_MAT_DATE_PICKER) public data: ArsMatDatePickerConfig
  ){
  }

  ngOnInit(): void{
  }

  dateChange(e: MatDatepickerInputEvent<any>){
    console.log(e);
  }

}
