import { Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ARS_MAT_TOGGLE_CONFIG, ArsMatToggleConfig } from './ars-mat-toggle-config';
import { ArsAnchor } from '../../../models/util/ars-observer';

@Component({
  selector:'ars-mat-toggle',
  templateUrl:'./mat-toggle.component.html',
  styleUrls:['./mat-toggle.component.scss']
})
export class MatToggleComponent implements OnInit{

  public translate: TranslateService;
  public state: ArsAnchor<boolean>;

  constructor(
    @Inject(ARS_MAT_TOGGLE_CONFIG) public data: ArsMatToggleConfig
  ){
    this.translate = data.translate;
    this.state = data.checked.createAnchor();
  }

  ngOnInit(){
  }

  public action(e: MouseEvent){
    if (this.data.checkAsToggle){
      this.data.checked.set(!this.data.checked.get());
    }
    if (this.data.callback){
      this.data.callback(e);
    }
  }

}
