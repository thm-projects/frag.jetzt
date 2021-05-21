import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TagCloudComponent } from '../../tag-cloud/tag-cloud.component';
import { CloudParameters } from '../../tag-cloud/tag-cloud.interface';
import { WeightClass } from './weight-class.interface';

@Component({
  selector: 'app-cloud-configuration',
  templateUrl: './cloud-configuration.component.html',
  styleUrls: ['./cloud-configuration.component.scss'],
})
export class CloudConfigurationComponent implements OnInit {
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


  isTestCloud = false;

  constructor(private translateService: TranslateService) {}

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.cloudParameters = this.parent.currentCloudParameters;
    this.defaultCloudParameters = this.parent.currentCloudParameters;
    this.parseArrayToJsonWeightClasses();
    this.extendedView = false;
  }

  fontColorChanged(value: string) {
    this.cloudParameters.fontColor = value;
    this.valueChanged();
  }

  backgroundColorChanged(value: string) {
    this.cloudParameters.backgroundColor = value;
    this.valueChanged();
  }

  parseArrayToJsonWeightClasses(){
    this.cloudParameters.cloudWeightSettings.forEach((element, i) => {
      this.weightClasses[i].maxTagNumber = element.maxVisibleElements;
      this.weightClasses[i].tagColor = element.color;
    });
  }

  parseJsonToArrayWeightClasses(){
    this.weightClasses.forEach((element, i) => {
      this.cloudParameters.cloudWeightSettings[i].maxVisibleElements =  element.maxTagNumber;
      this.cloudParameters.cloudWeightSettings[i].color =  element.tagColor;
    });
  }


  valueChanged(){
    this.parseJsonToArrayWeightClasses();
    this.parent.setCloudParameters(this.cloudParameters, false);
  }

  cancel(){
    this.parent.tagCloudDataManager.demoActive = false;
    this.parent.setCloudParameters(this.defaultCloudParameters);
    this.parent.configurationOpen = false;
  }

  save(){
    this.parent.tagCloudDataManager.demoActive = false;
    this.parent.setCloudParameters(this.cloudParameters);
    this.parent.configurationOpen = false;
  }

  toggleExtendedView(){
    this.extendedView = !this.extendedView;
  }


  weightColorChanged(index: number, event: string): void {
    this.weightClasses[index].tagColor = event;
    this.valueChanged();
  }

}
