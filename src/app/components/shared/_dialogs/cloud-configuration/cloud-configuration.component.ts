


import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TagCloudComponent } from '../../tag-cloud/tag-cloud.component';
import { CloudParameters } from '../../tag-cloud/tag-cloud.interface';

@Component({
  selector: 'app-cloud-configuration',
  templateUrl: './cloud-configuration.component.html',
  styleUrls: ['./cloud-configuration.component.scss'],
})
export class CloudConfigurationComponent implements OnInit{
  @Input() parent: TagCloudComponent;
  cloudParameters: CloudParameters;
  defaultCloudParameters: CloudParameters;
  oldCloudParameters: CloudParameters;
  extendedView: boolean;
 
  constructor(private translateService: TranslateService) {}

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.cloudParameters = this.parent.getCurrentCloudParameters();
    this.defaultCloudParameters = this.parent.getCurrentCloudParameters();
    this.extendedView = false;
  }

  fontColorChanged(value: string){
    this.cloudParameters.fontColor = value;
    this.parent.setCloudParameters(this.cloudParameters, false);
  }

  backgroundColorChanged(value: string){
    this.cloudParameters.backgroundColor = value;
    this.valueChanged()
  }

  valueChanged(){
    this.parent.setCloudParameters(this.cloudParameters, false);
  }

  cancel(){
    this.parent.setCloudParameters(this.defaultCloudParameters);
    this.parent.configurationOpen = false;
  }

  save(){
    this.parent.setCloudParameters(this.cloudParameters);
    this.parent.configurationOpen = false;
  }

  toggleExtendedView(){
    this.extendedView = !this.extendedView;
  }

}
