


import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TagCloudComponent } from '../../tag-cloud/tag-cloud.component';
import { CloudParameters } from '../../tag-cloud/tag-cloud.interface';
import { WeightClass } from '../../tag-cloud/weight-class.interface';

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
  weightClasses: WeightClass[]=[
    {maxTagNumber: 20,
    tagColor: '#8800ff'},
    {maxTagNumber: 20,
    tagColor: '#ff00ff'},
    {maxTagNumber: 17,
    tagColor: '#ffea00'},
    {maxTagNumber: 15,
    tagColor: '#00CC99'},
    {maxTagNumber: 12,
    tagColor: '#00CC66'},
    {maxTagNumber: 10,
    tagColor: '#0033FF'},
    {maxTagNumber: 8,
    tagColor: '#CC0099'},
    {maxTagNumber: 7,
    tagColor: '#FF3399'},
    {maxTagNumber: 6,
    tagColor: '#FFFF00'},
    {maxTagNumber: 5,
    tagColor: '#FF0000'},
  ];

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
    this.valueChanged();
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
