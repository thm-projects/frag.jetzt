export interface CloudWeightSetting {
  maxVisibleElements: number;
  color: string;
  rotation: number;
  allowManualTagNumber: boolean;
}

export type CloudWeightSettings = [
  weight1: CloudWeightSetting,
  weight2: CloudWeightSetting,
  weight3: CloudWeightSetting,
  weight4: CloudWeightSetting,
  weight5: CloudWeightSetting,
  weight6: CloudWeightSetting,
  weight7: CloudWeightSetting,
  weight8: CloudWeightSetting,
  weight9: CloudWeightSetting,
  weight10: CloudWeightSetting
];

export enum CloudTextStyle {
  normal,
  lowercase,
  capitalized,
  uppercase
}

const colorRegex = /rgba?\((\d+), (\d+), (\d+)(?:, (\d(?:\.\d+)?))?\)/;

export class CloudParameters {

  static get currentParameters(): CloudParameters {
    const jsonData = localStorage.getItem('tagCloudConfiguration');
    const temp = jsonData != null ? JSON.parse(jsonData) : null;
    const elem = new CloudParameters();
    elem.resetToDefault();
    if (temp != null) {
      for (const key of Object.keys(elem)) {
        if (temp[key] !== undefined) {
          elem[key] = temp[key];
        }
      }
    }
    return elem;
  }

  static set currentParameters(parameters: CloudParameters) {
    localStorage.setItem('tagCloudConfiguration', JSON.stringify(parameters));
  }

  fontFamily: string;
  fontStyle: string;
  fontWeight: string;
  fontSize: string;
  backgroundColor: string;
  fontColor: string;
  fontSizeMin: number;
  fontSizeMax: number;
  hoverScale: number;
  hoverTime: number;
  hoverDelay: number;
  delayWord: number;
  randomAngles: boolean;
  sortAlphabetically: boolean;
  question: string;
  textTransform: CloudTextStyle;
  cloudWeightSettings: CloudWeightSettings;

  constructor(obj?: any) {
    if (obj) {
      this.fontFamily = obj.fontFamily;
      this.fontStyle = obj.fontStyle;
      this.fontWeight = obj.fontWeight;
      this.fontSize = obj.fontSize;
      this.backgroundColor = obj.backgroundColor;
      this.fontColor = obj.fontColor;
      this.fontSizeMin = obj.fontSizeMin;
      this.fontSizeMax = obj.fontSizeMax;
      this.hoverScale = obj.hoverScale;
      this.hoverTime = obj.hoverTime;
      this.hoverDelay = obj.hoverDelay;
      this.delayWord = obj.delayWord;
      this.randomAngles = obj.randomAngles;
      this.sortAlphabetically = obj.sortAlphabetically;
      this.question = obj.question;
      this.textTransform = obj.textTransform;
      this.cloudWeightSettings = [
        { ...obj.cloudWeightSettings[0] },
        { ...obj.cloudWeightSettings[1] },
        { ...obj.cloudWeightSettings[2] },
        { ...obj.cloudWeightSettings[3] },
        { ...obj.cloudWeightSettings[4] },
        { ...obj.cloudWeightSettings[5] },
        { ...obj.cloudWeightSettings[6] },
        { ...obj.cloudWeightSettings[7] },
        { ...obj.cloudWeightSettings[8] },
        { ...obj.cloudWeightSettings[9] }
      ];
    }
  }

  resetToDefault() {
    const p = document.createElement('p');
    p.style.display = 'none';
    document.body.appendChild(p);
    const minValue = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
    const isMobile = minValue < 500;
    const elements = isMobile ? 5 : 10;
    this.fontFamily = 'Dancing Script';
    this.fontStyle = 'normal';
    this.fontWeight = 'normal';
    this.fontSize = '10px';
    this.backgroundColor = this.resolveColor(p, 'var(--background, black)');
    this.fontColor = this.resolveColor(p, 'var(--secondary, greenyellow)');
    this.fontSizeMin = this.mapValue(minValue, 375, 750, 125, 200);
    this.fontSizeMax = this.mapValue(minValue, 375, 1500, 300, 900);
    this.hoverScale = this.mapValue(minValue, 375, 1500, 1.4, 2);
    this.hoverTime = 1;
    this.hoverDelay = 0.4;
    this.delayWord = 100;
    this.randomAngles = false;
    this.sortAlphabetically = false;
    this.question = '';
    this.textTransform = CloudTextStyle.capitalized;
    this.cloudWeightSettings = [
      { maxVisibleElements: elements, color: '#C0C0C0', rotation: 0, allowManualTagNumber: true },
      { maxVisibleElements: elements, color: '#d98e49', rotation: 0, allowManualTagNumber: true },
      { maxVisibleElements: elements, color: '#ccca3c', rotation: 0, allowManualTagNumber: true },
      { maxVisibleElements: elements, color: '#83e761', rotation: 0, allowManualTagNumber: true },
      { maxVisibleElements: elements, color: '#3accd4', rotation: 0, allowManualTagNumber: true },
      { maxVisibleElements: elements, color: '#54a1e9', rotation: 0, allowManualTagNumber: true },
      { maxVisibleElements: elements, color: '#3a44ee', rotation: 0, allowManualTagNumber: true },
      { maxVisibleElements: elements, color: '#9725eb', rotation: 0, allowManualTagNumber: true },
      { maxVisibleElements: elements, color: '#e436c7', rotation: 0, allowManualTagNumber: true },
      { maxVisibleElements: elements, color: '#ff0000', rotation: 0, allowManualTagNumber: true },
    ];
    p.remove();
  }

  private resolveColor(element: HTMLParagraphElement, color: string): string {
    element.style.backgroundColor = 'rgb(0, 0, 0)';
    element.style.backgroundColor = color;
    const result = window.getComputedStyle(element).backgroundColor.match(colorRegex);
    const r = parseInt(result[1], 10);
    const g = parseInt(result[2], 10);
    const b = parseInt(result[3], 10);
    return `#${((r * 256 + g) * 256 + b).toString(16).padStart(6, '0')}`;
  }

  private mapValue(current: number, minInput: number, maxInput: number, minOut: number, maxOut: number) {
    const value = (current - minInput) * (maxOut - minOut) / (maxInput - minInput) + minOut;
    return Math.min(maxOut, Math.max(minOut, value));
  }
}
