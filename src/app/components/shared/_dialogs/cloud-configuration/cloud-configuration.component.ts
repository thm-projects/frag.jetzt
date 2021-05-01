


import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CloudData, CloudOptions, ZoomOnHoverOptions } from 'angular-tag-cloud-module';

import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-cloud-configuration',
  templateUrl: './cloud-configuration.component.html',
  styleUrls: ['./cloud-configuration.component.scss'],
})
export class CloudConfigurationComponent implements OnInit {

  cloudDataForm: FormGroup;
  cloudConfigForm: FormGroup;
  data: CloudData[] = [];
  title: String = "Cloud Configuration"
  height: number = 400;
  overflow: boolean = false;
  realignonResize: boolean = true;
  randomizeAngle: boolean = true;
  background: string = "#333";
  delay: number = 1;

  hoverScale: number = 2;
  hoverTransitionTime: number = 1;
  hoverDelay: number = 1;
  hoverColor: string = "lightseagreen";

  defaultCloudOptions: CloudOptions = {
    width: 0.98,
    height: 500,
    overflow: false,
    strict: false,
    realignOnResize: true,
    randomizeAngle: true,
    zoomOnHover: {
      scale: 1.2,
      transitionTime: 0.6,
      delay: 0.1,
      color: '#33bb33',
    },
    step: 5,
    log: 'debug',
    delay: 50,
  };

  exampleDataOptions = {
    amount: 40,
    rotate: true,
    data: JSON.stringify(this.data, null, 2),
  };

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.cloudDataForm = this.fb.group({
      ...this.exampleDataOptions,
    });

    this.cloudConfigForm = this.fb.group({
      ...this.defaultCloudOptions,
      zoomOnHover: this.fb.group(this.defaultCloudOptions.zoomOnHover),
      customStyle: true,
      background: '#2C2C2C',
      font: 'italic bold 14px "Indie Flower", cursive',
    });

  }

  log(eventType: string, e?: CloudData) {
    console.log(eventType, e);
  }



  renderJsonData() {
    try {
      this.data = JSON.parse(this.cloudDataForm.value.data);
    } catch (error) {
      this.snackBar.open(error, 'Ok, got it!', {
        duration: 2500,
      });
    }
  }

  reDraw() {
    let data: CloudData[] = [];
    try {
      data = JSON.parse(this.cloudDataForm.value.data);
    } catch (error) {
      this.snackBar.open(
        'Error parsing JSON. Fall back to random data.' + error,
        'Ok, got it!',
        {
          duration: 3000,
        },
      );
    }

    const changedData$: Observable<CloudData[]> = of(data);
    changedData$.subscribe((res) => this.setData(res));
  }

  private setData(data: CloudData[]) {
    this.data = data;
    this.cloudDataForm.get('data').setValue(JSON.stringify(this.data, null, 2));
  }

  public cancel(){

  }

  public save (){

  }
}