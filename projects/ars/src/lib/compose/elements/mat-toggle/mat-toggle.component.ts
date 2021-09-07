import { Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ARS_MAT_TOGGLE_CONFIG, ArsMatToggleConfig } from './ars-mat-toggle-config';
import { MatButtonToggleChange } from '@angular/material/button-toggle/button-toggle';

@Component({
  selector: 'ars-mat-toggle',
  templateUrl: './mat-toggle.component.html',
  styleUrls: ['./mat-toggle.component.scss']
})
export class MatToggleComponent implements OnInit {

  public translate:TranslateService;
  constructor(
    @Inject(ARS_MAT_TOGGLE_CONFIG) public data:ArsMatToggleConfig
  ) {
    this.translate=data.translate;
  }

  ngOnInit(){
  }

  public action(e:MatButtonToggleChange){

  }

}
