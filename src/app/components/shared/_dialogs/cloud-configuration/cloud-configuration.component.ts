import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TagCloudComponent } from '../../tag-cloud/tag-cloud.component';
import { TagCloudMetaDataCount } from '../../tag-cloud/tag-cloud.data-manager';
import { CloudParameters, CloudTextStyle } from '../../tag-cloud/tag-cloud.interface';
import { WeightClass } from './weight-class.interface';

@Component({
  selector: 'app-cloud-configuration',
  templateUrl: './cloud-configuration.component.html',
  styleUrls: ['./cloud-configuration.component.scss'],
})
export class CloudConfigurationComponent implements OnInit {
  @Input() parent: TagCloudComponent;
  CloudTextStyle: CloudTextStyle;
  cloudParameters: CloudParameters;
  defaultCloudParameters: CloudParameters;
  oldCloudParameters: CloudParameters;
  countPerWeight: TagCloudMetaDataCount;
  extendedView: boolean;
  cleanUpView: boolean;
  automaticSpelling: boolean;
  lowerCase: boolean;
  capitalization: boolean;
  standard: boolean;
  alphabeticalSorting: boolean;
  rotation: number;
  highestWeight: number;
  weightClasses: WeightClass[] = [
    {
      maxTagNumber: 20,
      tagColor: '#8800ff',
      actualTagNumber: 5,
      rotationAngle: 0
    },
    {
      maxTagNumber: 20,
      tagColor: '#ff00ff',
      actualTagNumber: 5,
      rotationAngle: 0,
    },
    {
      maxTagNumber: 17,
      tagColor: '#ffea00',
      actualTagNumber: 5,
      rotationAngle: 0
    },
    {
      maxTagNumber: 15,
      tagColor: '#00CC99',
      actualTagNumber: 5,
      rotationAngle: 0
    },
    {
      maxTagNumber: 12,
      tagColor: '#00CC66',
      actualTagNumber: 5,
      rotationAngle: 0
    },
    {
      maxTagNumber: 10,
      tagColor: '#0033FF',
      actualTagNumber: 5,
      rotationAngle: 0
    },
    {
      maxTagNumber: 8,
      tagColor: '#CC0099',
      actualTagNumber: 5,
      rotationAngle: 0
    },
    {
      maxTagNumber: 7,
      tagColor: '#FF3399',
      actualTagNumber: 5,
      rotationAngle: 0
    },
    {
      maxTagNumber: 6,
      tagColor: '#FFFF00',
      actualTagNumber: 5,
      rotationAngle: 0
    },
    {
      maxTagNumber: 5,
      tagColor: '#FF0000',
      actualTagNumber: 5,
      rotationAngle: 0
    },
  ];


  isTestCloud = false;

  constructor(private translateService: TranslateService) { }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.cloudParameters = this.parent.currentCloudParameters;
    this.defaultCloudParameters = this.parent.currentCloudParameters;
    this.parent.dataManager.getMetaData().subscribe((value)=>{
      this.countPerWeight = value.countPerWeight;
      this.parseArrayToJsonWeightClasses();
    })
    this.extendedView = false;
    this.cleanUpView = false;
    this.automaticSpelling = true;
    this.lowerCase = true;
    this.capitalization = false;
    this.standard = false;
    this.alphabeticalSorting = true;
    this.rotation = 360;
    this.highestWeight = 100;
  }

  fontColorChanged(value: string) {
    this.cloudParameters.fontColor = value;
    this.valueChanged();
  }

  backgroundColorChanged(value: string) {
    this.cloudParameters.backgroundColor = value;
    this.valueChanged();
  }

  parseArrayToJsonWeightClasses() {
    this.cloudParameters.cloudWeightSettings.forEach((element, i) => {
       this.weightClasses[i].maxTagNumber = element.maxVisibleElements;
       this.weightClasses[i].tagColor = element.color;
       this.weightClasses[i].actualTagNumber = this.countPerWeight[i];
    });
  }

  parseJsonToArrayWeightClasses() {
    this.weightClasses.forEach((element, i) => {
      this.cloudParameters.cloudWeightSettings[i].maxVisibleElements = element.maxTagNumber;
      this.cloudParameters.cloudWeightSettings[i].color = element.tagColor;
    });
  }


  valueChanged() {
    this.parseJsonToArrayWeightClasses();
    this.parent.setCloudParameters(this.cloudParameters, false);
  }

  cancel() {
    console.log("Parameterliste: " + JSON.stringify(this.cloudParameters));
    this.parent.tagCloudDataManager.demoActive = false;
    this.parent.setCloudParameters(this.defaultCloudParameters);
    this.parent.configurationOpen = false;
  }

  save() {
    this.parent.tagCloudDataManager.demoActive = false;
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

  textStyleChanged(val: CloudTextStyle) {
    this.cloudParameters.textTransform = val;
    this.valueChanged();
  }

}
