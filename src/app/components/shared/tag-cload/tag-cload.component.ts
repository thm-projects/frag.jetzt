import { Component, OnInit } from '@angular/core';
import { CloudData, CloudOptions, ZoomOnHoverOptions } from 'angular-tag-cloud-module';

@Component({
  selector: 'app-tag-cload',
  template: `<div>
              <mat-checkbox [(ngModel)]="options.randomizeAngle" class="example-margin">Random Angle</mat-checkbox>
              <angular-tag-cloud
                [data]="exampleData"
                [width]="options.width"
                [height]="options.height"
                [randomizeAngle]= "options.randomizeAngle"
                [overflow]="options.overflow">
              </angular-tag-cloud>
            </div>`,
  styleUrls: ['./tag-cload.component.scss']
})
export class TagCloadComponent implements OnInit {

  public exampleData = [
    {
      "text": "w9",
      "weight": 9,
      "rotate": -18,
      "tooltip": "tooltip w9"
    },
    {
      "text": "w7",
      "weight": 7,
      "rotate": 0,
      "tooltip": "tooltip w7"
    },
    {
      "text": "w10-link-ext",
      "weight": 10,
      "link": "http://example.org",
      "external": true,
      "rotate": -13,
      "tooltip": "tooltip w10-link-ext"
    },
    {
      "text": "w2-color-link",
      "weight": 2,
      "color": "#1ea15",
      "link": "http://example.org",
      "rotate": 16,
      "tooltip": "tooltip w2-color-link"
    },
    {
      "text": "w9",
      "weight": 9,
      "rotate": -17,
      "tooltip": "tooltip w9"
    },
    {
      "text": "w3-link-ext",
      "weight": 3,
      "link": "http://example.org",
      "external": true,
      "rotate": 0,
      "tooltip": "tooltip w3-link-ext"
    },
    {
      "text": "w2",
      "weight": 2,
      "rotate": 0,
      "tooltip": "tooltip w2"
    },
    {
      "text": "w1-link-ext",
      "weight": 1,
      "link": "http://example.org",
      "external": true,
      "rotate": 0,
      "tooltip": "tooltip w1-link-ext"
    },
    {
      "text": "w2-color-link-ext",
      "weight": 2,
      "color": "#53adbf",
      "link": "http://example.org",
      "external": true,
      "rotate": 0,
      "tooltip": "tooltip w2-color-link-ext"
    },
    {
      "text": "w6-color-link-ext",
      "weight": 6,
      "color": "#aff0ba",
      "link": "http://example.org",
      "external": true,
      "rotate": 0,
      "tooltip": "tooltip w6-color-link-ext"
    },
    {
      "text": "w3-color-link",
      "weight": 3,
      "color": "#7e8a34",
      "link": "http://example.org",
      "rotate": -12,
      "tooltip": "tooltip w3-color-link"
    },
    {
      "text": "w4",
      "weight": 4,
      "rotate": 0,
      "tooltip": "tooltip w4"
    },
    {
      "text": "w3-color",
      "weight": 3,
      "color": "#f3ff87",
      "rotate": 0,
      "tooltip": "tooltip w3-color"
    },
    {
      "text": "w9",
      "weight": 9,
      "rotate": 2,
      "tooltip": "tooltip w9"
    },
    {
      "text": "w1-color",
      "weight": 1,
      "color": "#7c2789",
      "rotate": 16,
      "tooltip": "tooltip w1-color"
    },
    {
      "text": "w10-color-link-ext",
      "weight": 10,
      "color": "#64dc80",
      "link": "http://example.org",
      "external": true,
      "rotate": 0,
      "tooltip": "tooltip w10-color-link-ext"
    },
    {
      "text": "w3",
      "weight": 3,
      "rotate": 0,
      "tooltip": "tooltip w3"
    },
    {
      "text": "w4",
      "weight": 4,
      "rotate": 0,
      "tooltip": "tooltip w4"
    },
    {
      "text": "w1-link-ext",
      "weight": 1,
      "link": "http://example.org",
      "external": true,
      "rotate": 17,
      "tooltip": "tooltip w1-link-ext"
    },
    {
      "text": "w5-color-link",
      "weight": 5,
      "color": "#9b9444",
      "link": "http://example.org",
      "rotate": 0,
      "tooltip": "tooltip w5-color-link"
    },
    {
      "text": "w10-color-link-ext",
      "weight": 10,
      "color": "#f7c39a",
      "link": "http://example.org",
      "external": true,
      "rotate": 16,
      "tooltip": "tooltip w10-color-link-ext"
    },
    {
      "text": "w4-link",
      "weight": 4,
      "link": "http://example.org",
      "rotate": 0,
      "tooltip": "tooltip w4-link"
    },
    {
      "text": "w7-link",
      "weight": 7,
      "link": "http://example.org",
      "rotate": 0,
      "tooltip": "tooltip w7-link"
    },
    {
      "text": "w2",
      "weight": 2,
      "rotate": -2,
      "tooltip": "tooltip w2"
    },
    {
      "text": "w8-color-link",
      "weight": 8,
      "color": "#e6b63f",
      "link": "http://example.org",
      "rotate": 2,
      "tooltip": "tooltip w8-color-link"
    },
    {
      "text": "w8-color-link-ext",
      "weight": 8,
      "color": "#d7e6fc",
      "link": "http://example.org",
      "external": true,
      "rotate": 0,
      "tooltip": "tooltip w8-color-link-ext"
    },
    {
      "text": "w5",
      "weight": 5,
      "rotate": 12,
      "tooltip": "tooltip w5"
    },
    {
      "text": "w7-color-link",
      "weight": 7,
      "color": "#975717",
      "link": "http://example.org",
      "rotate": 0,
      "tooltip": "tooltip w7-color-link"
    },
    {
      "text": "w8-color-link-ext",
      "weight": 8,
      "color": "#25d1be",
      "link": "http://example.org",
      "external": true,
      "rotate": -16,
      "tooltip": "tooltip w8-color-link-ext"
    },
    {
      "text": "w9",
      "weight": 9,
      "rotate": 0,
      "tooltip": "tooltip w9"
    },
    {
      "text": "w3-color-link-ext",
      "weight": 3,
      "color": "#9d7e63",
      "link": "http://example.org",
      "external": true,
      "rotate": 0,
      "tooltip": "tooltip w3-color-link-ext"
    },
    {
      "text": "w9-color-link-ext",
      "weight": 9,
      "color": "#16093e",
      "link": "http://example.org",
      "external": true,
      "rotate": 0,
      "tooltip": "tooltip w9-color-link-ext"
    },
    {
      "text": "w3-color",
      "weight": 3,
      "color": "#3674cd",
      "rotate": 0,
      "tooltip": "tooltip w3-color"
    },
    {
      "text": "w10-color-link",
      "weight": 10,
      "color": "#fcd7f1",
      "link": "http://example.org",
      "rotate": 0,
      "tooltip": "tooltip w10-color-link"
    },
    {
      "text": "w4-color-link-ext",
      "weight": 4,
      "color": "#a0976a",
      "link": "http://example.org",
      "external": true,
      "rotate": 0,
      "tooltip": "tooltip w4-color-link-ext"
    },
    {
      "text": "w1-color",
      "weight": 1,
      "color": "#120e75",
      "rotate": 0,
      "tooltip": "tooltip w1-color"
    },
    {
      "text": "w8-color",
      "weight": 8,
      "color": "#58fb55",
      "rotate": 0,
      "tooltip": "tooltip w8-color"
    },
    {
      "text": "w3-color-link-ext",
      "weight": 3,
      "color": "#354f70",
      "link": "http://example.org",
      "external": true,
      "rotate": 0,
      "tooltip": "tooltip w3-color-link-ext"
    },
    {
      "text": "w3",
      "weight": 3,
      "rotate": 0,
      "tooltip": "tooltip w3"
    },
    {
      "text": "w8-color",
      "weight": 8,
      "color": "#d31e8f",
      "rotate": 0,
      "tooltip": "tooltip w8-color"
    }
  ];

  options: CloudOptions = {
    // if width is between 0 and 1 it will be set to the width of the upper element multiplied by the value
    width: 1000,
    // if height is between 0 and 1 it will be set to the height of the upper element multiplied by the value
    height: 500,
    overflow: false,
    randomizeAngle: false
  };

  zoomOnHoverOptions: ZoomOnHoverOptions = {
    scale: 2,
    transitionTime: 2,
    color: "#123456"
  }

  constructor() { }

  ngOnInit(): void {

  }

}
