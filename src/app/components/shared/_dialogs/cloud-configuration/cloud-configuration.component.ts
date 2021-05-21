import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TagCloudComponent } from '../../tag-cloud/tag-cloud.component';
import { CloudParameters } from '../../tag-cloud/tag-cloud.interface';
import { WeightClass } from './weight-class.interface';

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
  cleanUpView: boolean;
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
    this.cloudParameters = this.parent.getCurrentCloudParameters();
    this.defaultCloudParameters = this.parent.getCurrentCloudParameters();
    this.parseArrayToJsonWeightClasses();
    this.extendedView = false;
    this.cleanUpView = false;
  }

  fontColorChanged(value: string){
    this.cloudParameters.fontColor = value;
    this.valueChanged();
  }

  backgroundColorChanged(value: string){
    this.cloudParameters.backgroundColor = value;
    this.valueChanged();
  }

  parseArrayToJsonWeightClasses(){
    this.cloudParameters.cloudWeightCount.forEach((element, i) => {
      this.weightClasses[i].maxTagNumber = element;
    });

    this.cloudParameters.cloudWeightColor.forEach((element, i) => {
      this.weightClasses[i].tagColor = element;
    });
  }

  parseJsonToArrayWeightClasses(){
    this.weightClasses.forEach((element, i) => {
      this.cloudParameters.cloudWeightCount[i] =  element.maxTagNumber;
      this.cloudParameters.cloudWeightColor[i] =  element.tagColor;
    });
  }


  valueChanged(){
    this.parseJsonToArrayWeightClasses();
    this.parent.setCloudParameters(this.cloudParameters, false);
  }

  cancel(){
    this.parent.isDemo = true;
    this.parent.demoToggle();
    this.parent.setCloudParameters(this.defaultCloudParameters);
    this.parent.configurationOpen = false;
  }

  save(){
    this.parent.isDemo = true;
    this.parent.demoToggle();
    this.parent.setCloudParameters(this.cloudParameters);
    this.parent.configurationOpen = false;
  }

  toggleExtendedView() {
    this.cleanUpView = false;
    this.extendedView = !this.extendedView;
  }

  toggleCleanupView() {
    this.cleanUpView = !this.cleanUpView;
    this.extendedView = false;
  }

  weightColorChanged(index: number, event: string): void {
    this.weightClasses[index].tagColor = event;
    this.valueChanged();
  }

}
