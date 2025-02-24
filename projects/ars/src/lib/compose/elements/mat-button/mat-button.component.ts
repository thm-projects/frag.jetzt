import { Component, Inject, OnInit } from '@angular/core';
import { ARS_MAT_BUTTON_CONFIG, ArsMatButtonConfig } from './ars-mat-button-config';

@Component({
    selector: 'ars-mat-button',
    templateUrl: './mat-button.component.html',
    styleUrls: ['./mat-button.component.scss'],
    standalone: false
})
export class MatButtonComponent implements OnInit{

  constructor(
    @Inject(ARS_MAT_BUTTON_CONFIG) public data: ArsMatButtonConfig
  ){
  }

  ngOnInit(): void{
  }

}
