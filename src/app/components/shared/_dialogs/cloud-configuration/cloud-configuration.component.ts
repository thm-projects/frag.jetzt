import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { TagCloudComponent } from '../../tag-cloud/tag-cloud.component';
import { WeightClass } from './weight-class.interface';
import { TagCloudMetaDataCount } from '../../../../services/util/tag-cloud-data.service';
import { CloudParameters, CloudTextStyle } from '../../../../utils/cloud-parameters';
import { AppComponent } from '../../../../app.component';

@Component({
  selector: 'app-cloud-configuration',
  templateUrl: './cloud-configuration.component.html',
  styleUrls: ['./cloud-configuration.component.scss'],
})
export class CloudConfigurationComponent implements OnInit {
  @Input() parent: TagCloudComponent;
  cloudParameters: CloudParameters;
  defaultCloudParameters: CloudParameters;
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
  step = 10;
  weightClasses: WeightClass[] = [
    {
      maxTagNumber: 20,
      tagColor: '#8800ff',
      actualTagNumber: 5,
      rotationAngle: 0,
      allowManualTagNumber: false
    },
    {
      maxTagNumber: 20,
      tagColor: '#ff00ff',
      actualTagNumber: 5,
      rotationAngle: 0,
      allowManualTagNumber: false
    },
    {
      maxTagNumber: 17,
      tagColor: '#ffea00',
      actualTagNumber: 5,
      rotationAngle: 0,
      allowManualTagNumber: false
    },
    {
      maxTagNumber: 15,
      tagColor: '#00CC99',
      actualTagNumber: 5,
      rotationAngle: 0,
      allowManualTagNumber: false
    },
    {
      maxTagNumber: 12,
      tagColor: '#00CC66',
      actualTagNumber: 5,
      rotationAngle: 0,
      allowManualTagNumber: false
    },
    {
      maxTagNumber: 10,
      tagColor: '#0033FF',
      actualTagNumber: 5,
      rotationAngle: 0,
      allowManualTagNumber: false
    },
    {
      maxTagNumber: 8,
      tagColor: '#CC0099',
      actualTagNumber: 5,
      rotationAngle: 0,
      allowManualTagNumber: false
    },
    {
      maxTagNumber: 7,
      tagColor: '#FF3399',
      actualTagNumber: 5,
      rotationAngle: 0,
      allowManualTagNumber: false
    },
    {
      maxTagNumber: 6,
      tagColor: '#FFFF00',
      actualTagNumber: 5,
      rotationAngle: 0,
      allowManualTagNumber: false
    },
    {
      maxTagNumber: 5,
      tagColor: '#FF0000',
      actualTagNumber: 5,
      rotationAngle: 0,
      allowManualTagNumber: false
    },
  ];
  minFont: number;
  maxFont: number;

  isTestCloud = false;

  constructor(private translateService: TranslateService) {
  }

  ngOnInit() {
    this.translateService.use(localStorage.getItem('currentLang'));
    this.cloudParameters = new CloudParameters(this.parent.currentCloudParameters);
    this.defaultCloudParameters = new CloudParameters(this.parent.currentCloudParameters);
    this.parent.dataManager.getMetaData().subscribe((value) => {
      if (!value) {
        return;
      }
      this.countPerWeight = value.countPerWeight;
      this.parseArrayToJsonWeightClasses();
    });
    this.extendedView = false;
    this.cleanUpView = false;
    this.automaticSpelling = true;
    this.lowerCase = true;
    this.capitalization = false;
    this.standard = false;
    this.alphabeticalSorting = true;
    this.rotation = 360;
    this.highestWeight = 100;
    this.readMaxFont();
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
      this.weightClasses[i].tagColor = element.color;
      this.weightClasses[i].actualTagNumber = this.countPerWeight[i];
      this.weightClasses[i].rotationAngle = element.rotation;
      this.weightClasses[i].maxTagNumber = (element.maxVisibleElements === -1 || element.maxVisibleElements === 0) ?
        this.weightClasses[i].actualTagNumber : element.maxVisibleElements;
      this.weightClasses[i].allowManualTagNumber = element.allowManualTagNumber;
    });
  }

  parseJsonToArrayWeightClasses() {
    this.weightClasses.forEach((element, i) => {
      this.cloudParameters.cloudWeightSettings[i].allowManualTagNumber = element.allowManualTagNumber;
      if (element.allowManualTagNumber) {
        this.cloudParameters.cloudWeightSettings[i].maxVisibleElements = element.maxTagNumber === 0 ? -1 : element.maxTagNumber;
      } else {
        this.cloudParameters.cloudWeightSettings[i].maxVisibleElements = -1;
      }
      this.cloudParameters.cloudWeightSettings[i].color = element.tagColor;
      this.cloudParameters.cloudWeightSettings[i].rotation = element.rotationAngle;
    });
  }

  valueChanged() {
    this.parseJsonToArrayWeightClasses();
    this.parent.setCloudParameters(this.cloudParameters, false);
  }

  closePanel() {
    this.parent.tagCloudDataManager.demoActive = false;
    this.parent.drawer.close();
    this.readMaxFont();
    const defaultScale = AppComponent.rescale.getInitialScale();
    if (defaultScale !== 1) {
      AppComponent.rescale.setDefaultScale(defaultScale);
      this.parent.updateTagCloud();
    }
  }

  openPanel() {
    if (AppComponent.rescale.getInitialScale() !== 1) {
      AppComponent.rescale.setDefaultScale(1);
    }
  }

  cancel() {
    this.parent.setCloudParameters(this.defaultCloudParameters);
    this.parent.updateTagCloudSettings();
    this.cloudParameters = new CloudParameters(this.defaultCloudParameters);
    this.setStep(0);
    this.closePanel();
  }

  save() {
    this.parent.setCloudParameters(this.cloudParameters);
    this.parent.updateTagCloudSettings();
    this.defaultCloudParameters = new CloudParameters(this.cloudParameters);
    this.setStep(0);
    this.closePanel();
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

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }

  reset() {
    this.parent.resetColorsToTheme();
    this.cloudParameters = new CloudParameters(this.parent.currentCloudParameters);
    this.defaultCloudParameters = new CloudParameters(this.parent.currentCloudParameters);
    this.closePanel();
  }

  italicChecked(event) {
    this.cloudParameters.fontStyle = event.checked === true ? 'italic' : 'normal';
    this.valueChanged();
  }

  boldChecked(event) {
    this.cloudParameters.fontWeight = event.checked === true ? 'bold' : 'normal';
    this.valueChanged();
  }

  checkBold() {
    return this.cloudParameters.fontWeight === 'bold';
  }

  readMaxFont() {
    const valMax: number = this.cloudParameters.fontSizeMax;
    const valMin: number = this.cloudParameters.fontSizeMin;
    this.maxFont = Math.floor(valMax / valMin);
  }

  calcMaxFont(event, setMin: boolean) {
    const val = Number(event.target.value);
    if (val > 0 && val <= 10 && !setMin) {
      this.cloudParameters.fontSizeMax = this.cloudParameters.fontSizeMin * val;
      this.maxFont = val;
      this.valueChanged();
    }
    if (setMin) {
      this.cloudParameters.fontSizeMax = this.cloudParameters.fontSizeMin * this.maxFont;
      this.valueChanged();
    }
  }
}
